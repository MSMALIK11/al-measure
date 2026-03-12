"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import View from "ol/View"
import Overlay from "ol/Overlay"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import XYZ from "ol/source/XYZ"
import VectorSource from "ol/source/Vector"
import Style from "ol/style/Style"
import Fill from "ol/style/Fill"
import Stroke from "ol/style/Stroke"
import CircleStyle from "ol/style/Circle"
import Text from "ol/style/Text"
import Draw from "ol/interaction/Draw"
import Modify from "ol/interaction/Modify"
import Select from "ol/interaction/Select"
import GeoJSON from "ol/format/GeoJSON"
import { fromLonLat, toLonLat } from "ol/proj"
import { getArea, getLength } from "ol/sphere"
import "ol/ol.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Toolbox from "./ToolBox"
import TakeoffSidebar from "@/components/client/TakeoffSidebar"
import { Polygon } from "ol/geom"
import Feature from "ol/Feature"
import { useFeatureStore } from "@/app/store/useClientStore"
import { Task } from "@/lib/task-types"
type Feature = any
type Geometry = any

type LayerType = "polygon" | "line" | "point"
type Tool =
  | null
  | "select"
  | "polygon"
  | "line"
  | "point"
  | "split"
  | "clip"
  | "reshape"
  | "merge"
  | "delete"
  | "measure"

type HistoryItem =
  | { action: "draw"; feature: Feature; layerType: LayerType }
  | { action: "delete"; features: Feature[]; layerType: LayerType }

type LayerItem = {
  id: string
  name: string
  type: LayerType
  visible: boolean
  stats: number
}
 type FeatureInfo = {
    type: string;
    area?: number;
    length?: number;
    unit?: string;
  }
type MapAppProps = {
  onFeatureDrawn?: (feature: any) => void
  getAreaSqft?: (area: string) => void
  userRole: string
  takeoffIndustry?: string
  onTakeoffIndustryChange?: (v: string) => void
  selectedFeatures?: string[]
  onFeaturesChange?: (features: string[]) => void
  onLocateMe?: () => void
  /** For employee: load request's existing geometry into the map */
  initialGeometry?: any
  /** Called when geometry changes (draw/modify/delete) so parent can save */
  onGeometryChange?: (
    geometry: { type: "FeatureCollection"; features: any[] },
    takeoffItemsFromMap: { id: string; label: string; type: "polygon" | "line" | "point"; area?: number; length?: number; unit: string; color?: string }[]
  ) => void
  /** Current surface for new shapes (label + color). When set, new drawn features get this label and color. */
  activeSurface?: { id: string; label: string; color: string }
  /** Aggregated stats by label (area/length) for sidebar display */
  onSurfaceStats?: (stats: { label: string; color: string; area: number; length?: number }[]) => void
  /** QA comments with map position (employee view). When showCommentPins is true, show as pins on map. */
  commentPins?: Array<{ id: string; text: string; position?: [number, number] }>
  /** When true, render comment pins on the map (employee can hide/show) */
  showCommentPins?: boolean
  /** Client request creation: address shown in sidebar */
  propertyAddress?: string
  /** Client request creation: address change callback */
  onPropertyAddressChange?: (v: string) => void
  /** Client request creation: "Not My Property" callback */
  onNotMyProperty?: () => void
}

const defaultLayers: Record<LayerType, LayerItem[]> = {
  polygon: [
    { id: "parcels", name: "Land Parcels", type: "polygon", visible: true, stats: 0 },
    { id: "water", name: "Water Bodies", type: "polygon", visible: true, stats: 0 },
  ],
  line: [
    { id: "roads", name: "Roads", type: "line", visible: true, stats: 0 },
    { id: "rivers", name: "Rivers", type: "line", visible: true, stats: 0 },
  ],
  point: [
    { id: "landmarks", name: "Landmarks", type: "point", visible: true, stats: 0 },
    { id: "schools", name: "Schools", type: "point", visible: true, stats: 0 },
  ],
}

const colorChoices = ["#4a80f5", "#f54a4a", "#4af54a", "#f5e64a", "#9d4af5", "#f54ae6"]

const DEFAULT_SURFACES = [
  { id: "lawn", label: "Lawn", color: "#22c55e" },
  { id: "drive-lanes", label: "Drive Lanes", color: "#3b82f6" },
  { id: "driveway", label: "Driveway", color: "#78716c" },
  { id: "building", label: "Building", color: "#6366f1" },
  { id: "mulch", label: "Mulch Bed", color: "#a16207" },
  { id: "pavement", label: "Pavement", color: "#64748b" },
  { id: "parking", label: "Parking", color: "#a855f7" },
  { id: "sidewalk", label: "Sidewalk", color: "#94a3b8" },
]

export default function MapApp(props: MapAppProps) {
  // Layout state
  const [search, setSearch] = useState("")
  const [activePanel, setActivePanel] = useState<Record<LayerType, boolean>>({
    polygon: true,
    line: false,
    point: false,
  })
  const { addFeature } = useFeatureStore()
  // Layers state
  const [layers, setLayers] = useState<Record<LayerType, LayerItem[]>>(defaultLayers)
  const [selectedLayerType, setSelectedLayerType] = useState<LayerType>("polygon")
  const [selectedLayerId, setSelectedLayerId] = useState<string>("parcels")
  const [areaSqft, setAreaSqft] = useState<number | string>("")
  // Surfaces (for client/employee): multiple shapes with colors and labels
  const [surfaces, setSurfaces] = useState<{ id: string; label: string; color: string }[]>(DEFAULT_SURFACES)
  const [activeSurfaceId, setActiveSurfaceId] = useState<string>(DEFAULT_SURFACES[0]?.id ?? "lawn")
  const [surfaceStats, setSurfaceStats] = useState<{ label: string; color: string; area: number; length?: number }[]>([])
  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId) || surfaces[0]
  const [surfacesVisible, setSurfacesVisible] = useState(true)
  /** Labels to hide on the map (per-surface visibility). */
  const [hiddenSurfaceLabels, setHiddenSurfaceLabels] = useState<string[]>([])
  const highlightedSurfaceLabelRef = useRef<string | null>(null)
  const hiddenSurfaceLabelsRef = useRef<Set<string>>(new Set())
  /** Ref so drawend always uses the currently selected surface (avoids stale closure). */
  const activeSurfaceRef = useRef<{ id: string; label: string; color: string } | null>(
    surfaces.find((s) => s.id === activeSurfaceId) || surfaces[0] || null
  )
  const surfacesRef = useRef(surfaces)
  surfacesRef.current = surfaces
  // OL refs (initialized after OL loads)
  const mapRef = useRef<Map | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const baseLayerRef = useRef<TileLayer | null>(null)
  const sourcesRef = useRef<Record<LayerType, VectorSource>>({} as any)
  const vectorLayersRef = useRef<Record<LayerType, VectorLayer>>({} as any)
  const markerOverlayRef = useRef<Overlay | null>(null)
  const commentOverlaysRef = useRef<Overlay[]>([])
  const [mapReady, setMapReady] = useState(false)

  // Interactions
  const drawRef = useRef<Draw | null>(null)
  const modifyRef = useRef<Modify | null>(null)
  const selectRef = useRef<Select | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Coordinates + info overlays
  const [coordsText, setCoordsText] = useState("Longitude: 78.9629° | Latitude: 20.5937° | Zoom: 5")
  const [featureInfo, setFeatureInfo] = useState<FeatureInfo | null>(null)
const [takeoffFeatureArea,setTakeoffarea]=useState({})
  // Symbology
  const [symbolOpen, setSymbolOpen] = useState(false)
  const [symbolColor, setSymbolColor] = useState("#4a80f5")
  const [symbolOpacity, setSymbolOpacity] = useState(70) // 0-100
  // History
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyPointer, setHistoryPointer] = useState(-1)

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapElRef.current) return

    // Sources and layers
    sourcesRef.current = {
      polygon: new VectorSource(),
      line: new VectorSource(),
      point: new VectorSource(),
    }
    const defaultColor = "#4a80f5"
    // Same group = same transparent fill (by label/color). Highlight = thicker stroke only.
    const GROUP_FILL_OPACITY = 0.35
    const styleFn = (f: any, layerType: LayerType, highlight: boolean) => {
      const color = f.get("color") || defaultColor
      const label = f.get("label") || ""
      const hexToRgba = (hex: string, alpha: number) => {
        const r = Number.parseInt(hex.slice(1, 3), 16)
        const g = Number.parseInt(hex.slice(3, 5), 16)
        const b = Number.parseInt(hex.slice(5, 7), 16)
        return `rgba(${r},${g},${b},${alpha})`
      }
      const strokeWidth = layerType === "polygon" ? (highlight ? 4 : 2) : highlight ? 4 : 3
      const textStyle =
        label && layerType === "polygon"
          ? new Text({
              text: label,
              fill: new Fill({ color: "#1a1a1a" }),
              stroke: new Stroke({ color: "#fff", width: 3 }),
              font: "bold 12px sans-serif",
              overflow: true,
            })
          : label && (layerType === "line" || layerType === "point")
            ? new Text({
                text: label,
                fill: new Fill({ color: "#1a1a1a" }),
                stroke: new Stroke({ color: "#fff", width: 2 }),
                font: "11px sans-serif",
                overflow: true,
              })
            : undefined
      if (layerType === "polygon") {
        const geom = f.getGeometry()
        const interior = geom && typeof geom.getInteriorPoint === "function" ? geom.getInteriorPoint() : null
        const fillColor = hexToRgba(color, GROUP_FILL_OPACITY)
        if (label && interior) {
          return [
            new Style({
              fill: new Fill({ color: fillColor }),
              stroke: new Stroke({ color, width: strokeWidth }),
            }),
            new Style({
              geometry: interior,
              text: textStyle,
            }),
          ]
        }
        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color, width: strokeWidth }),
          text: textStyle || undefined,
        })
      }
      if (layerType === "line") {
        return new Style({
          stroke: new Stroke({ color, width: strokeWidth }),
          text: textStyle,
        })
      }
      return new Style({
        image: new CircleStyle({
          radius: highlight ? 10 : 8,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
        text: textStyle,
      })
    }
    const vectorStyleWithHighlight = (f: any, layerType: LayerType) => {
      const label = f.get("label") || ""
      if (hiddenSurfaceLabelsRef.current.has(label)) return null
      const highlight = highlightedSurfaceLabelRef.current === label
      return styleFn(f, layerType, highlight)
    }
    vectorLayersRef.current = {
      polygon: new VectorLayer({
        source: sourcesRef.current.polygon,
        style: (f) => vectorStyleWithHighlight(f, "polygon"),
      }),
      line: new VectorLayer({
        source: sourcesRef.current.line,
        style: (f) => vectorStyleWithHighlight(f, "line"),
      }),
      point: new VectorLayer({
        source: sourcesRef.current.point,
        style: (f) => vectorStyleWithHighlight(f, "point"),
      }),
    }

    const base = new TileLayer({
      source: new XYZ({
        url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        attributions: "google",
        maxZoom: 20,
      }),
    })
    baseLayerRef.current = base

    const map = new Map({
      target: mapElRef.current!,
      layers: [base, vectorLayersRef.current.polygon, vectorLayersRef.current.line, vectorLayersRef.current.point],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5,
        maxZoom: 20,
      }),
    })
    mapRef.current = map
    const tReady = setTimeout(() => setMapReady(true), 0)

    // Search marker overlay
    const markerEl = document.createElement("div")
    markerEl.innerHTML = '<span aria-hidden="true" style="font-size: 24px; color: #ff3333;">•</span><span class="sr-only">Search marker</span>'
    const marker = new Overlay({ element: markerEl, positioning: "bottom-center" })
    map.addOverlay(marker)
    markerOverlayRef.current = marker

    // Pointer move coordinates
    map.on("pointermove", (evt) => {
      const [lon, lat] = toLonLat(evt.coordinate)
      const zoom = map.getView().getZoom() ?? 0
      setCoordsText(`Longitude: ${lon.toFixed(4)}° | Latitude: ${lat.toFixed(4)}° | Zoom: ${zoom.toFixed(2)}`)
    })

    setSelectedLayerType("polygon")
    setSelectedLayerId("parcels")

    return () => {
      clearTimeout(tReady)
      setMapReady(false)
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [])

  // Keep activeSurfaceRef in sync so drawend always uses the selected surface
  useEffect(() => {
    activeSurfaceRef.current = activeSurface ?? null
  }, [activeSurface])

  // Sync highlighted surface (sidebar selection) → ref and redraw shapes
  useEffect(() => {
    const label = activeSurface?.label ?? null
    highlightedSurfaceLabelRef.current = label
    if (sourcesRef.current) {
      sourcesRef.current.polygon.changed()
      sourcesRef.current.line.changed()
      sourcesRef.current.point.changed()
    }
  }, [activeSurface?.label])

  // Sync hidden surface labels → ref and redraw shapes
  useEffect(() => {
    hiddenSurfaceLabelsRef.current = new Set(hiddenSurfaceLabels)
    if (sourcesRef.current) {
      sourcesRef.current.polygon.changed()
      sourcesRef.current.line.changed()
      sourcesRef.current.point.changed()
    }
  }, [hiddenSurfaceLabels])

  // Comment pins (QA feedback on map) – employee can show/hide
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    commentOverlaysRef.current.forEach((o) => map.removeOverlay(o))
    commentOverlaysRef.current = []
    const pins = props.showCommentPins && props.commentPins?.length ? props.commentPins : []
    const withPosition = pins.filter((c): c is typeof c & { position: [number, number] } => !!c.position && c.position.length >= 2)
    withPosition.forEach((c, i) => {
      const el = document.createElement("div")
      el.title = c.text
      el.textContent = String(i + 1)
      Object.assign(el.style, {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#f59e0b",
        color: "#fff",
        border: "2px solid white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
      })
      const overlay = new Overlay({
        element: el,
        position: fromLonLat(c.position),
        positioning: "bottom-center",
      })
      map.addOverlay(overlay)
      commentOverlaysRef.current.push(overlay)
    })
    return () => {
      commentOverlaysRef.current.forEach((o) => map.removeOverlay(o))
      commentOverlaysRef.current = []
    }
  }, [mapReady, props.showCommentPins, props.commentPins])

  // Load initial geometry (e.g. request geometry for employee)
  useEffect(() => {
    const map = mapRef.current
    const raw = props.initialGeometry
    if (!map || !raw || !sourcesRef.current?.polygon) return
    const normalized =
      raw?.type === "FeatureCollection"
        ? raw
        : raw?.type === "Feature"
          ? { type: "FeatureCollection" as const, features: [raw] }
          : null
    if (!normalized?.features?.length) return
    const fmt = new GeoJSON()
    try {
      normalized.features.forEach((f: any) => {
        const geom = f.geometry || f
        const type = geom.type
        let layerType: LayerType = "polygon"
        if (type === "Point" || type === "MultiPoint") layerType = "point"
        else if (type === "LineString" || type === "MultiLineString") layerType = "line"
        else if (type === "Polygon" || type === "MultiPolygon") layerType = "polygon"
        else return
        const featProps = f.properties || {}
        const olFeat = fmt.readFeature(
          { type: "Feature", geometry: geom, properties: featProps },
          { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
        )
        if (featProps.label) olFeat.set("label", featProps.label)
        if (featProps.color) olFeat.set("color", featProps.color)
        sourcesRef.current[layerType].addFeature(olFeat)
      })
      let extent: number[] | null = null
      ;(["polygon", "line", "point"] as LayerType[]).forEach((lt) => {
        const ext = sourcesRef.current[lt].getExtent()
        if (ext.every((n) => isFinite(n))) {
          extent = extent ? [Math.min(extent[0], ext[0]), Math.min(extent[1], ext[1]), Math.max(extent[2], ext[2]), Math.max(extent[3], ext[3])] : ext
        }
      })
      if (extent) {
        map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 18 })
      }
    } catch (e) {
      console.error("[MapApp] Failed to load initial geometry:", e)
    }
  }, [props.initialGeometry])

  // Helper: update symbology style for selected layer type
  const applyLayerStyle = useCallback(
    (hex: string, opacityPercent: number) => {
      if (!vectorLayersRef.current?.polygon) return
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const g = Number.parseInt(hex.slice(3, 5), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      const opacity = opacityPercent / 100

      const vl = vectorLayersRef.current
      if (selectedLayerType === "polygon") {
        vl.polygon.setStyle(
          new Style({
            fill: new Fill({ color: `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity * 0.3))})` }),
            stroke: new Stroke({ color: `rgba(${r}, ${g}, ${b}, 1)`, width: 2 }),
          }),
        )
      } else if (selectedLayerType === "line") {
        vl.line.setStyle(
          new Style({
            stroke: new Stroke({ color: `rgba(${r}, ${g}, ${b}, 1)`, width: 3 }),
          }),
        )
      } else {
        vl.point.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({ color: `rgba(${r}, ${g}, ${b}, 1)` }),
              stroke: new Stroke({ color: "#ffffff", width: 2 }),
            }),
          }),
        )
      }
    },
    [selectedLayerType],
  )

  useEffect(() => {
    applyLayerStyle(symbolColor, symbolOpacity)
  }, [symbolColor, symbolOpacity, applyLayerStyle])

  // Emit full geometry + takeoff items for parent (e.g. employee save)
  const emitGeometryChange = useCallback(() => {
    if (!sourcesRef.current) return
    const fmt = new GeoJSON()
    const features: any[] = []
    const takeoffItems: { id: string; label: string; type: "polygon" | "line" | "point"; area?: number; length?: number; unit: string; color?: string }[] = []
    const statsByLabel: Record<string, { color: string; area: number; length: number }> = {}
    let idx = 0
    ;(["polygon", "line", "point"] as LayerType[]).forEach((layerType) => {
      sourcesRef.current[layerType].getFeatures().forEach((f: any) => {
        try {
          const label = f.get("label") || (layerType === "polygon" ? `Area ${idx + 1}` : layerType === "line" ? `Length ${idx + 1}` : `Point ${idx + 1}`)
          const color = f.get("color") || "#4a80f5"
          const obj = fmt.writeFeatureObject(f, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          })
          if (obj) {
            if (obj.properties) {
              (obj as any).properties.label = label
              ;(obj as any).properties.color = color
            } else {
              (obj as any).properties = { label, color }
            }
            features.push(obj)
            idx++
            const geom = f.getGeometry()
            const type = layerType === "polygon" ? "polygon" : layerType === "line" ? "line" : "point"
            const unit = layerType === "polygon" ? "sq ft" : layerType === "line" ? "ft" : "count"
            let area = 0
            let length = 0
            if (layerType === "polygon" && geom) {
              area = Number((getArea(geom) * 10.764).toFixed(2))
              takeoffItems.push({ id: `map-${idx}`, label, type, area, unit, color })
            } else if (layerType === "line" && geom) {
              length = Number((getLength(geom) * 3.281).toFixed(2))
              takeoffItems.push({ id: `map-${idx}`, label, type, length, unit, color })
            } else {
              takeoffItems.push({ id: `map-${idx}`, label, type, unit, color })
            }
            if (!statsByLabel[label]) statsByLabel[label] = { color, area: 0, length: 0 }
            statsByLabel[label].area += area
            statsByLabel[label].length += length
          }
        } catch (_) {}
      })
    })
    props.onGeometryChange?.({ type: "FeatureCollection", features }, takeoffItems)
    const surfaceStats = Object.entries(statsByLabel).map(([label, v]) => ({
      label,
      color: v.color,
      area: Number(v.area.toFixed(2)),
      length: v.length ? Number(v.length.toFixed(2)) : undefined,
    }))
    props.onSurfaceStats?.(surfaceStats)
    setSurfaceStats(surfaceStats)
  }, [props.onGeometryChange, props.onSurfaceStats])

  // Tool switching
  const clearInteractions = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (drawRef.current) {
      map.removeInteraction(drawRef.current)
      drawRef.current = null
    }
    if (modifyRef.current) {
      map.removeInteraction(modifyRef.current)
      modifyRef.current = null
    }
    if (selectRef.current) {
      map.removeInteraction(selectRef.current)
      selectRef.current = null
    }
  }, [])

  const setActiveTool = useCallback(
    (t: Tool) => {
      setTool(t)
      setFeatureInfo(null)
      setSymbolOpen(false)
      setIsDrawing(t === "polygon" || t === "line" || t === "point")

      const map = mapRef.current
      if (!map) return

      clearInteractions()

      const source = sourcesRef.current[selectedLayerType]

      switch (t) {
        case "select": {
          const sel = new Select()
          selectRef.current = sel
          map.addInteraction(sel)
          sel.on("select", (e: any) => {
            if (e.selected.length > 0) {
              const f = e.selected[0];
              const geomType = f.getGeometry()?.getType();
              if (geomType === "Polygon") {
                const areaSqFt = +(getArea(f.getGeometry()) * 10.764).toFixed(2);
                setFeatureInfo({
                  type: "Polygon",
                  area: areaSqFt,
                  unit: "sq ft",
                });
                console.log('setting',areaSqFt)
                addFeature({
                  type: "Polygon",
                  area: areaSqFt,
                  unit: "sq ft",
                })
               
              } else if (geomType === "LineString") {
                const lengthFt = +(getLength(f.getGeometry()) * 3.281).toFixed(2);
                setFeatureInfo({
                  type: "Line",
                  length: lengthFt,
                  unit: "ft",
                });
                addFeature({
                   type: "Line",
                  length: lengthFt,
                  unit: "ft",
                })
              } else {
                setFeatureInfo({
                  type: "Point",
                });
                
              }
            } else {
              setFeatureInfo(null);
             
            }

          })
          break
        }
        case "polygon":
        case "line":
        case "point": {
          const type = t === "polygon" ? "Polygon" : t === "line" ? "LineString" : "Point"
          const draw = new Draw({ source, type })
          drawRef.current = draw
          map.addInteraction(draw)

          draw.on("drawend", (e: any) => {
            const surface =
              activeSurfaceRef.current ||
              props.activeSurface ||
              surfacesRef.current[0]
            if (surface) {
              e.feature.set("label", surface.label)
              e.feature.set("color", surface.color)
            }
            // Update stats on active layer item
            setLayers((prev) => {
              const newState = { ...prev }
              const key = selectedLayerType
              const list = [...newState[key]]
              const idx = list.findIndex((l) => l.id === selectedLayerId)
              if (idx !== -1) {
                const item = { ...list[idx] }
                if (key === "polygon") {
                  const areaSqFt = getArea(e.feature.getGeometry()) * 10.764
                  item.stats = Number.parseFloat((item.stats + areaSqFt).toFixed(2))
                  props.getAreaSqft?.(areaSqFt.toString())
                  setAreaSqft( Number.parseFloat((areaSqFt).toFixed(2)))
                } else if (key === "line") {
                  const lenFt = getLength(e.feature.getGeometry()) * 3.281
                  item.stats = Number.parseFloat((item.stats + lenFt).toFixed(2))
                } else {
                  item.stats = item.stats + 1
                }
                list[idx] = item
                newState[key] = list
              }
              return newState
            })

            // Save to history
            setHistory((h) => {
              const base = h.slice(0, historyPointer + 1)
              return [...base, { action: "draw", feature: e.feature, layerType: selectedLayerType }]
            })
            setHistoryPointer((p) => p + 1)

            // Emit drawn feature as GeoJSON (WGS84) so API and admin map can use it
            try {
              const fmt = new GeoJSON()
              const featureObj = fmt.writeFeatureObject(e.feature, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
              })
              props.onFeatureDrawn?.(featureObj)
              setTakeoffarea(featureObj)
            } catch (err) {
              console.error("[v0] Failed to serialize feature:", err)
            }
            emitGeometryChange()
          })
          break
        }
       case "reshape": {
  const modify = new Modify({ source })
  modifyRef.current = modify
  map.addInteraction(modify)

  modify.on("modifyend", (e: any) => {
    e.features.forEach((f: any) => {
      setLayers((prev) => {
        const newState = { ...prev }
        const key = selectedLayerType
        const list = [...newState[key]]
        const idx = list.findIndex((l) => l.id === selectedLayerId)
        if (idx !== -1) {
          const item = { ...list[idx] }
          if (key === "polygon") {
            const areaSqFt = getArea(f.getGeometry()) * 10.764
            item.stats = Number.parseFloat(areaSqFt.toFixed(2)) // replace with updated area
            props.getAreaSqft?.(areaSqFt.toString())
            setAreaSqft(Number.parseFloat(areaSqFt.toFixed(2)))
          } else if (key === "line") {
            const lenFt = getLength(f.getGeometry()) * 3.281
            item.stats = Number.parseFloat(lenFt.toFixed(2))
          }
          list[idx] = item
          newState[key] = list
        }
        return newState
      })
    })
    emitGeometryChange()
  })

  break
}

        case "delete": {
          const sel = new Select()
          selectRef.current = sel
          map.addInteraction(sel)
          sel.once("select", () => {
            const feats = sel.getFeatures().getArray()
            if (feats.length > 0) {
              setHistory((h) => {
                const base = h.slice(0, historyPointer + 1)
                return [...base, { action: "delete", features: feats.slice(), layerType: selectedLayerType }]
              })
              setHistoryPointer((p) => p + 1)

              feats.forEach((f: any) => {
                setLayers((prev) => {
                  const newState = { ...prev }
                  const key = selectedLayerType
                  const list = [...newState[key]]
                  const idx = list.findIndex((l) => l.id === selectedLayerId)
                  if (idx !== -1) {
                    const item = { ...list[idx] }
                    if (key === "polygon") {
                      const areaSqFt = getArea(f.getGeometry()) * 10.764
                      item.stats = Math.max(0, Number.parseFloat((item.stats - areaSqFt).toFixed(2)))
                    } else if (key === "line") {
                      const lenFt = getLength(f.getGeometry()) * 3.281
                      item.stats = Math.max(0, Number.parseFloat((item.stats - lenFt).toFixed(2)))
                    } else {
                      item.stats = Math.max(0, item.stats - 1)
                    }
                    list[idx] = item
                    newState[key] = list
                  }
                  return newState
                })
                sourcesRef.current[selectedLayerType].removeFeature(f)
              })
            }
            emitGeometryChange()
            setActiveTool("select")
          })
          break
        }
        case "split": {
          alert("Split tool would split the selected feature in a full implementation.")
          setActiveTool("select")
          break
        }
        case "clip": {
          alert("Clip tool would clip the selected feature in a full implementation.")
          setActiveTool("select")
          break
        }
        case "merge": {
          alert("Merge tool would merge selected features in a full implementation.")
          setActiveTool("select")
          break
        }
        case "measure": {
          alert("Measurement tool activated. Click on the map to measure distance or area.")
          setActiveTool("select")
          break
        }
        case null:
        default:
          break
      }
    },
    [clearInteractions, selectedLayerId, selectedLayerType, historyPointer, props, emitGeometryChange, activeSurface],
  )

  // Undo/Redo
  const onUndo = useCallback(() => {
    if (historyPointer < 0) return
    const item = history[historyPointer]
    if (!item) return
    if (item.action === "draw") {
      sourcesRef.current[item.layerType].removeFeature(item.feature)
    } else if (item.action === "delete") {
      item.features.forEach((f) => sourcesRef.current[item.layerType].addFeature(f))
    }
    setHistoryPointer((p) => p - 1)
  }, [history, historyPointer])

  const onRedo = useCallback(() => {
    if (historyPointer >= history.length - 1) return
    const next = history[historyPointer + 1]
    if (!next) return
    if (next.action === "draw") {
      sourcesRef.current[next.layerType].addFeature(next.feature)
    } else if (next.action === "delete") {
      next.features.forEach((f) => sourcesRef.current[next.layerType].removeFeature(f))
    }
    setHistoryPointer((p) => p + 1)
  }, [history, historyPointer])
  const bboxLayerRef = useRef<VectorLayer<VectorSource<Feature<Polygon>>> | null>(null);
  useEffect(() => {
    if (!bboxLayerRef.current) {
      bboxLayerRef.current = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: 'rgba(0, 150, 255, 0.8)',
            width: 2
          }),
          fill: new Fill({
            color: 'rgba(0, 150, 255, 0.2)'
          })
        })
      });
      mapRef.current?.addLayer(bboxLayerRef.current);
    }
  }, []);
 

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault()
        onUndo()
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault()
        onRedo()
      }
      if (e.key === "Backspace" && isDrawing) {
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onUndo, onRedo, isDrawing])

  // Search (coords or geocode)
  const onSearch = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const val = search.trim()
    if (!val) return

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}`)
      const data = await resp.json()
      if (Array.isArray(data) && data.length > 0) {
        const { lon, lat } = data[0]
        const center = fromLonLat([Number.parseFloat(lon), Number.parseFloat(lat)])
        map.getView().animate({ center, zoom: 17, duration: 800 })
        markerOverlayRef.current?.setPosition(center)
        setTimeout(() => markerOverlayRef.current?.setPosition(undefined), 10000)
      } else {
        alert("Address not found. Try another query.")
      }
    } catch (err) {
      console.error("[v0] Geocoding error:", err)
      alert("Geocoding service unavailable. Please try again later.")
    }
  }, [search])
  // Imagery selector
  const onImageryChange =(e: any) => {
    const base = baseLayerRef.current
    // const { value } = e.target
    if (!base) return
    let url = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    let attributions = "Google"
    let maxZoom = 20
    // switch (value) {
    //   case "esri":
    //     url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    //     attributions = "Tiles © Esri"
    //     maxZoom = 20
    //     break
    //   case "google":
    //     url = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    //     attributions = "Google"
    //     maxZoom = 20
    //     break
    //   case "bing":
    //     url = "https://tiles.virtualearth.net/tiles/a{q}.jpeg?g=1"
    //     attributions = "Bing Maps"
    //     maxZoom = 19
    //     break
    //   case "usgs":
    //     url = "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
    //     attributions = "USGS"
    //     maxZoom = 16
    //     break
    // }
    base.setSource(new XYZ({ url, attributions, maxZoom }))
  }

  // File upload
  const onUpload = useCallback((type: LayerType, file: File | null) => {
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext !== "geojson" && ext !== "json") {
      alert("Please select a GeoJSON file.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        const features = new GeoJSON().readFeatures(json, { featureProjection: "EPSG:3857" })
        sourcesRef.current[type].addFeatures(features)

        setSelectedLayerType(type)
        setLayers((prev) => {
          const newState = { ...prev }
          const list = [...newState[type]]
          const name = file.name.replace(/\.(geo)?json$/i, "")
          const id = name.toLowerCase().replace(/\s+/g, "-")
          const newItem: LayerItem = { id, name, type, visible: true, stats: 0 }
          list.unshift(newItem)

          if (type === "polygon") {
            let totalArea = 0
            features.forEach((f: any) => (totalArea += getArea(f.getGeometry())))
            list[0].stats = Number.parseFloat((totalArea * 10.764).toFixed(2))
          } else if (type === "line") {
            let totalLen = 0
            features.forEach((f: any) => (totalLen += getLength(f.getGeometry())))
            list[0].stats = Number.parseFloat((totalLen * 3.281).toFixed(2))
          } else {
            list[0].stats = features.length
          }

          newState[type] = list
          setSelectedLayerId(id)
          return newState
        })
      } catch (e) {
        console.error("[v0] Error parsing GeoJSON:", e)
        alert("Error parsing GeoJSON. Please ensure it is valid.")
      }
    }
    reader.readAsText(file)
  }, [])

  // Save project (aggregate all features)
  const onSaveProject = useCallback(() => {
    const all = { type: "FeatureCollection", features: [] as any[] }
    const fmt = new GeoJSON()
      ; (["polygon", "line", "point"] as LayerType[]).forEach((lt) => {
        sourcesRef.current[lt].getFeatures().forEach((f: any) => {
          const obj = fmt.writeFeatureObject(f)
            ; (obj as any).properties = { ...(obj as any).properties, layerType: lt }
          all.features.push(obj)
        })
      })
    const blob = new Blob([JSON.stringify(all)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "landscape-measurements-project.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert("Project saved successfully!")
  }, [])

  // Export current layer
  const onExportLayer = useCallback(() => {
    const feats = sourcesRef.current[selectedLayerType].getFeatures()
    if (feats.length === 0) {
      alert("No features to export in the selected layer.")
      return
    }
    const fmt = new GeoJSON()
    const json = fmt.writeFeatures(feats)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedLayerType}-layer.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert("Layer exported successfully!")
  }, [selectedLayerType])

  const onSelectLayerItem = (item: LayerItem) => {
    setSelectedLayerType(item.type)
    setSelectedLayerId(item.id)
  }

  const toggleTypeVisibility = (type: LayerType, visible: boolean) => {
    if (!vectorLayersRef.current[type]) return
    vectorLayersRef.current[type].setVisible(visible)
    setLayers((prev) => {
      const list = prev[type].map((l) => ({ ...l, visible }))
      return { ...prev, [type]: list }
    })
  }

  const onDeleteLayerItem = (item: LayerItem) => {
    const isDefault =
      (item.type === "polygon" && (item.id === "parcels" || item.id === "water")) ||
      (item.type === "line" && (item.id === "roads" || item.id === "rivers")) ||
      (item.type === "point" && (item.id === "landmarks" || item.id === "schools"))
    if (!confirm(`Delete layer "${item.name}"?`)) return
    sourcesRef.current[item.type]?.clear()
    setLayers((prev) => {
      const newState = { ...prev }
      const list = [...newState[item.type]]
      const idx = list.findIndex((l) => l.id === item.id)
      if (idx !== -1) list[idx] = { ...list[idx], stats: 0 }
      newState[item.type] = isDefault ? list : list.filter((l) => l.id !== item.id)
      return newState
    })
  }

  const statLabel = (type: LayerType, v: number) =>
    type === "point"
      ? `Total Points: ${v}`
      : type === "line"
        ? `Total Length: ${v.toFixed(2)} ft`
        : `Total Area: ${v.toFixed(2)} sq ft`

  // UI
  const header = (
    <header className="h-14  flex items-center justify-between px-4 ">
      <div className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true">🗺️</span>
        <span className="text-pretty">Live Landscape Measurements</span>
      </div>
      <div className="flex items-center gap-2 w-[50%] max-w-2xl">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter coordinates (e.g., 78.9629,20.5937) or address"
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="bg-secondary text-secondary-foreground"
          aria-label="Search by coordinates or address"
        />
        <Button onClick={onSearch} variant="default">
          Search
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onSaveProject} variant="secondary">
          Save
        </Button>
        <Button onClick={onExportLayer} variant="default">
          Export
        </Button>
      </div>
    </header>
  )

  const Panel = ({ type, title, children }: { type: LayerType; title: string; children: React.ReactNode }) => (
    <Card className="bg-card text-card-foreground ">
      <CardHeader
        onClick={() => setActivePanel((p) => ({ ...p, [type]: !p[type] }))}
        className="cursor-pointer"
        aria-expanded={activePanel[type]}
        role="button"
      >
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{title}</span>
          <span aria-hidden="true">{activePanel[type] ? "▴" : "▾"}</span>
        </CardTitle>
      </CardHeader>
      {activePanel[type] && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )

  const LayerList = ({ type }: { type: LayerType }) => {
    const items = layers[type]
    return (
      <div className="flex flex-col gap-2">
        {/* pending use icons with tooltip instead of  text button */}
        <div className="flex flex-col items-center justify-between">
          <Button
            size="sm"
            variant="default"
            onClick={() => toggleTypeVisibility(type, !items.every((l) => l.visible))}
          >
            {items.every((l) => l.visible) ? "Hide" : "Show"} {type}
          </Button>
          <label className="text-sm underline cursor-pointer">
            <input
              type="file"
              accept=".geojson,.json"
              className="hidden"
              onChange={(e) => onUpload(type, e.target.files?.[0] ?? null)}
            />
            Import {type}
          </label>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const name = prompt(`Enter a name for the new ${type} layer:`)
              if (!name) return
              const id = name.toLowerCase().replace(/\s+/g, "-")
              setLayers((prev) => {
                const list = [{ id, name, type, visible: true, stats: 0 }, ...prev[type]]
                return { ...prev, [type]: list }
              })
              setSelectedLayerType(type)
              setSelectedLayerId(id)
            }}
          >
            + Add
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it) => {
            const isActive = it.type === selectedLayerType && it.id === selectedLayerId
            return (
              <div
                key={it.id}
                className={cn(
                  "rounded-md border p-2 text-sm flex items-center justify-between",
                  isActive ? "border-primary" : "border-border",
                  "bg-muted",
                )}
                onClick={() => onSelectLayerItem(it)}
                role="button"
                aria-pressed={isActive}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn("w-3 h-3 rounded-sm", {
                      "bg-chart-3": it.type === "polygon",
                      "bg-destructive": it.type === "line",
                      "rounded-full bg-chart-4": it.type === "point",
                    })}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span>{it.name}</span>
                    <span className="text-xs text-muted-foreground">{statLabel(it.type, it.stats)}</span>
                    
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSymbolOpen((o) => !o)
                    }}
                    aria-label="Open symbol panel"
                  >
                    🎨
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteLayerItem(it)
                    }}
                    aria-label="Delete layer"
                  >
                    🗑️
                  </Button>
                  
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100svh]">
    
      {header}

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        {/* <aside className="w-80 shrink-0 border-r bg-sidebar text-sidebar-foreground p-3 overflow-auto">
          <div className="flex flex-col gap-3">
            <Panel type="polygon" title="Polygon Layers">
              <LayerList type="polygon" />
            </Panel>
            <Panel type="line" title="Line Layers">
              <LayerList type="line" />
            </Panel>
            <Panel type="point" title="Point Layers">
              <LayerList type="point" />
            </Panel>
          </div>
        </aside> */}
        <aside className=" shrink-0 border-r  text-sidebar-foreground p-3 overflow-auto">
          <div className="flex flex-col gap-3">
            {props.userRole === "developer" && (
              <>
                <Panel type="polygon" title="Polygon Layers">
                  <LayerList type="polygon" />
                </Panel>
                <Panel type="line" title="Line Layers">
                  <LayerList type="line" />
                </Panel>
                <Panel type="point" title="Point Layers">
                  <LayerList type="point" />
                </Panel>

              </>
            )}

            {(props.userRole === "client" || props.userRole === "employee") && (
              <TakeoffSidebar
                areaSqft={areaSqft}
                takeoffIndustry={props.takeoffIndustry}
                onTakeoffIndustryChange={props.onTakeoffIndustryChange}
                selectedFeatures={props.selectedFeatures}
                onFeaturesChange={props.onFeaturesChange}
                showSurfacesPanel={props.userRole === "employee"}
                surfaces={surfaces}
                activeSurfaceId={activeSurfaceId}
                onActiveSurfaceChange={(id) => {
                  setActiveSurfaceId(id)
                  const s = surfaces.find((surf) => surf.id === id)
                  if (s) activeSurfaceRef.current = s
                }}
                surfaceStats={surfaceStats}
                onAddSurface={() => {
                  const id = `surface-${Date.now()}`
                  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#78716c"]
                  const color = colors[surfaces.length % colors.length]
                  const newSurface = { id, label: "New surface", color }
                  setSurfaces((prev) => [...prev, newSurface])
                  setActiveSurfaceId(id)
                  activeSurfaceRef.current = newSurface
                }}
                onRenameSurface={(id, label) => {
                  setSurfaces((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)))
                }}
                onRemoveSurface={(id) => {
                  const surface = surfaces.find((s) => s.id === id)
                  const labelToDelete = surface?.label
                  const nextSurfaces = surfaces.filter((s) => s.id !== id)
                  setSurfaces(nextSurfaces)
                  if (activeSurfaceId === id && nextSurfaces.length > 0) {
                    setActiveSurfaceId(nextSurfaces[0].id)
                    activeSurfaceRef.current = nextSurfaces[0]
                  } else if (nextSurfaces.length === 0) activeSurfaceRef.current = null
                  if (labelToDelete) {
                    setHiddenSurfaceLabels((prev) => prev.filter((l) => l !== labelToDelete))
                    if (sourcesRef.current) {
                      ;(["polygon", "line", "point"] as LayerType[]).forEach((layerType) => {
                        const source = sourcesRef.current[layerType]
                        const toRemove = source.getFeatures().filter((f: any) => f.get("label") === labelToDelete)
                        toRemove.forEach((f) => source.removeFeature(f))
                      })
                      emitGeometryChange()
                    }
                  }
                }}
                hiddenSurfaceLabels={hiddenSurfaceLabels}
                onToggleSurfaceVisibility={(label) => {
                  setHiddenSurfaceLabels((prev) =>
                    prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
                  )
                }}
                surfacesVisible={surfacesVisible}
                onToggleSurfacesVisibility={(visible) => {
                  setSurfacesVisible(visible)
                  if (vectorLayersRef.current) {
                    vectorLayersRef.current.polygon.setVisible(visible)
                    vectorLayersRef.current.line.setVisible(visible)
                    vectorLayersRef.current.point.setVisible(visible)
                  }
                }}
                isClientVariant={props.userRole === "client"}
                propertyAddress={props.propertyAddress}
                onPropertyAddressChange={props.onPropertyAddressChange}
                onNotMyProperty={props.onNotMyProperty}
              />
            )}
          </div>
        </aside>


        {/* Map area */}
        <section className="flex-1 relative">
          <div ref={mapElRef} id="map" className="absolute inset-0" />
          <Toolbox setActiveTool={setActiveTool} activeTool={tool} clientMode={props.userRole === "client"} />


          {/* Drawing info */}
          {/* {isDrawing && (
            <div className="absolute top-[84px] right-4 bg-popover text-popover-foreground rounded-md shadow p-3 text-xs max-w-[250px] z-10">
              <div>Click on the map to start drawing</div>
              <div className="text-muted-foreground mt-1">Press Backspace to remove last vertex</div>
            </div>
          )} */}

          {/* Feature info */}
          {featureInfo && (
            <div className="absolute bottom-40 left-4 
                  w-72 max-h-40 p-4 rounded-xl 
                  bg-secondary/80 backdrop-blur-md 
                  border border-white/30 
                  shadow-lg text-white text-xs overflow-auto z-10">
              <h6 className="text-sm font-semibold mb-2">Feature Information</h6>
              <div>Type: {featureInfo.type}</div>
              {"area" in featureInfo && (
                <h5>Area: {featureInfo.area} {featureInfo.unit}</h5>
              )}
              {"length" in featureInfo && (
                <div>Length: {featureInfo.length} {featureInfo.unit}</div>
              )}
            </div>
          )}



          {/* Symbol panel */}
          {symbolOpen && (
            <div className="absolute top-40 right-4 bg-popover text-popover-foreground rounded-md shadow p-3 w-[220px] z-10">
              <h6 className="text-sm font-semibold mb-2">Layer Symbology</h6>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorChoices.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSymbolColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border",
                      symbolColor === c ? "ring-2 ring-primary" : "border-border",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <label className="text-xs block mb-1">Opacity: {symbolOpacity}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={symbolOpacity}
                onChange={(e) => setSymbolOpacity(Number.parseInt(e.target.value))}
                className="w-full"
                aria-label="Opacity"
              />
              <Button className="mt-3 w-full" onClick={() => setSymbolOpen(false)}>
                Apply
              </Button>
            </div>
          )}

          {/* History Controls */}
          {/* <div className="absolute bottom-20 right-4 flex items-center gap-2 z-10">
            <Card className="bg-popover text-popover-foreground">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Button onClick={onUndo} variant="secondary" size="sm" title="Undo (Ctrl+Z)">
                    Undo
                  </Button>
                  <Button onClick={onRedo} variant="secondary" size="sm" title="Redo (Ctrl+Y)">
                    Redo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Coordinates */}
          <div className="absolute bottom-4 left-4 bg-popover text-popover-foreground rounded-md shadow px-3 py-2 text-xs z-10">
            {coordsText}
          </div>

          {/* Locate Me (Attentive OnSite-style) */}
          {(props.userRole === "client" || props.userRole === "employee") && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 left-4 z-10 gap-2 shadow-md"
              onClick={() => {
                if (!mapRef.current || !navigator.geolocation) return
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const view = mapRef.current?.getView()
                    if (view) {
                      view.setCenter(fromLonLat([pos.coords.longitude, pos.coords.latitude]))
                      view.setZoom(17)
                    }
                    props.onLocateMe?.()
                  },
                  () => {},
                  { enableHighAccuracy: true }
                )
              }}
            >
              <MapPin className="h-4 w-4" />
              Locate Me
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}