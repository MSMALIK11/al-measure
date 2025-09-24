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
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Toolbox from "./ToolBox"
import TakeoffSidebar from "./ClientTakeoffSidebar"

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

type MapAppProps = {
  onFeatureDrawn?: (feature: any, layerType: LayerType) => void
  userRole: string
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

export default function MapApp(props: MapAppProps) {
  // Layout state
  const [search, setSearch] = useState("")
  const [activePanel, setActivePanel] = useState<Record<LayerType, boolean>>({
    polygon: true,
    line: false,
    point: false,
  })

  // Layers state
  const [layers, setLayers] = useState<Record<LayerType, LayerItem[]>>(defaultLayers)
  const [selectedLayerType, setSelectedLayerType] = useState<LayerType>("polygon")
  const [selectedLayerId, setSelectedLayerId] = useState<string>("parcels")

  // OL refs (initialized after OL loads)
  const mapRef = useRef<Map | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const baseLayerRef = useRef<TileLayer | null>(null)
  const sourcesRef = useRef<Record<LayerType, VectorSource>>({} as any)
  const vectorLayersRef = useRef<Record<LayerType, VectorLayer>>({} as any)
  const markerOverlayRef = useRef<Overlay | null>(null)

  // Interactions
  const drawRef = useRef<Draw | null>(null)
  const modifyRef = useRef<Modify | null>(null)
  const selectRef = useRef<Select | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Coordinates + info overlays
  const [coordsText, setCoordsText] = useState("Longitude: 78.9629° | Latitude: 20.5937° | Zoom: 5")
  const [featureInfo, setFeatureInfo] = useState<string | null>(null)

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
    vectorLayersRef.current = {
      polygon: new VectorLayer({
        source: sourcesRef.current.polygon,
        style: new Style({
          fill: new Fill({ color: "rgba(74, 128, 245, 0.3)" }),
          stroke: new Stroke({ color: "#4a80f5", width: 2 }),
        }),
      }),
      line: new VectorLayer({
        source: sourcesRef.current.line,
        style: new Style({
          stroke: new Stroke({ color: "#ff5722", width: 3 }),
        }),
      }),
      point: new VectorLayer({
        source: sourcesRef.current.point,
        style: new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: "#ffeb3b" }),
            stroke: new Stroke({ color: "#ffc107", width: 2 }),
          }),
        }),
      }),
    }

    const base = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions: "Tiles © Esri",
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
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [])

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
              const f = e.selected[0]
              const geomType = f.getGeometry()?.getType()
              if (geomType === "Polygon") {
                const areaSqFt = (getArea(f.getGeometry()) * 10.764).toFixed(2)
                setFeatureInfo(`<strong>Type:</strong> Polygon<br><strong>Area:</strong> ${areaSqFt} sq ft`)
              } else if (geomType === "LineString") {
                const lengthFt = (getLength(f.getGeometry()) * 3.281).toFixed(2)
                setFeatureInfo(`<strong>Type:</strong> Line<br><strong>Length:</strong> ${lengthFt} ft`)
              } else {
                setFeatureInfo(`<strong>Type:</strong> Point`)
              }
            } else {
              setFeatureInfo(null)
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

            // Emit drawn feature as GeoJSON to parent
            try {
              const fmt = new GeoJSON()
              const featureObj = fmt.writeFeatureObject(e.feature)
              props.onFeatureDrawn?.(featureObj, selectedLayerType)
            } catch (err) {
              console.error("[v0] Failed to serialize feature:", err)
            }
          })
          break
        }
        case "reshape": {
          const modify = new Modify({ source })
          modifyRef.current = modify
          map.addInteraction(modify)
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
    [clearInteractions, selectedLayerId, selectedLayerType, historyPointer, props],
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

    // Try "lon,lat"
    const parts = val.split(",").map((p) => Number.parseFloat(p.trim()))
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      const center = fromLonLat([parts[0], parts[1]])
      map.getView().animate({ center, zoom: 15, duration: 800 })
      markerOverlayRef.current?.setPosition(center)
      setTimeout(() => markerOverlayRef.current?.setPosition(undefined), 10000)
      return
    }

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}`)
      const data = await resp.json()
      if (Array.isArray(data) && data.length > 0) {
        const { lon, lat } = data[0]
        const center = fromLonLat([Number.parseFloat(lon), Number.parseFloat(lat)])
        map.getView().animate({ center, zoom: 15, duration: 800 })
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
  const onImageryChange = useCallback((e:any) => {
    const base = baseLayerRef.current
    const {value} = e.target
    if (!base) return
    let url = ""
    let attributions = ""
    let maxZoom = 20
    switch (value) {
      case "esri":
        url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attributions = "Tiles © Esri"
        maxZoom = 20
        break
      case "google":
        url = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attributions = "Google"
        maxZoom = 20
        break
      case "bing":
        url = "https://tiles.virtualearth.net/tiles/a{q}.jpeg?g=1"
        attributions = "Bing Maps"
        maxZoom = 19
        break
      case "usgs":
        url = "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
        attributions = "USGS"
        maxZoom = 16
        break
    }
    base.setSource(new XYZ({ url, attributions, maxZoom }))
  }, [])

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
    ;(["polygon", "line", "point"] as LayerType[]).forEach((lt) => {
      sourcesRef.current[lt].getFeatures().forEach((f: any) => {
        const obj = fmt.writeFeatureObject(f)
        ;(obj as any).properties = { ...(obj as any).properties, layerType: lt }
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
    <header className="h-14 flex items-center justify-between px-4 ">
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
    <Card className="bg-card text-card-foreground">
      <CardHeader
        onClick={() => setActivePanel((p) => ({ ...p, [type]: !p[type] }))}
        className="cursor-pointer py-3"
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
        <aside className=" shrink-0 border-r bg-sidebar text-sidebar-foreground p-3 overflow-auto">
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

    {props.userRole === "client" && (
      <>
      <TakeoffSidebar />
      </>
    )}
  </div>
</aside>


        {/* Map area */}
        <section className="flex-1 relative">
          <div ref={mapElRef} id="map" className="absolute inset-0" />
          <Toolbox setActiveTool={setActiveTool} activeTool={tool} />


          {/* Drawing info */}
          {isDrawing && (
            <div className="absolute top-[84px] right-4 bg-popover text-popover-foreground rounded-md shadow p-3 text-xs max-w-[250px] z-10">
              <div>Click on the map to start drawing</div>
              <div className="text-muted-foreground mt-1">Press Backspace to remove last vertex</div>
            </div>
          )}

          {/* Feature info */}
          {featureInfo && (
            <div
              className="absolute bottom-24 left-4 bg-popover text-popover-foreground rounded-md shadow p-3 text-xs max-w-[300px] max-h-[150px] overflow-auto z-10"
              dangerouslySetInnerHTML={{ __html: `<h6>Feature Information</h6><div>${featureInfo}</div>` }}
            />
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

          {/* History + Imagery */}
          <div className="absolute bottom-20 right-4 flex items-center gap-3 z-10">
            <Button onClick={onUndo} variant="secondary" size="sm" title="Undo (Ctrl+Z)">
              Undo
            </Button>
            <Card className="bg-popover text-popover-foreground">
              <CardContent className="p-3">
                <div className="text-xs font-semibold mb-2">Satellite Imagery</div>
                <select
    onchange={onImageryChange}
    className="w-60 border rounded-md p-2 text-sm"
    aria-label="Select satellite imagery"
  >
    <option value="esri" selected>ESRI World Imagery (High Resolution)</option>
    <option value="google">Google Satellite</option>
    <option value="bing">Bing Maps Aerial</option>
    <option value="usgs">USGS Historical</option>
  </select>
              </CardContent>
            </Card>
            <Button onClick={onRedo} variant="secondary" size="sm" title="Redo (Ctrl+Y)">
              Redo
            </Button>
          </div>

          {/* Coordinates */}
          <div className="absolute bottom-4 left-4 bg-popover text-popover-foreground rounded-md shadow px-3 py-2 text-xs z-10">
            {coordsText}
          </div>
        </section>
      </div>
    </div>
  )
}