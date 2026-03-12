"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Map from "ol/Map"
import View from "ol/View"
import Overlay from "ol/Overlay"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import XYZ from "ol/source/XYZ"
import GeoJSON from "ol/format/GeoJSON"
import Style from "ol/style/Style"
import Fill from "ol/style/Fill"
import Stroke from "ol/style/Stroke"
import CircleStyle from "ol/style/Circle"
import Feature from "ol/Feature"
import { fromLonLat, toLonLat } from "ol/proj"
import "ol/ol.css"

export type MapComment = { id: string; text: string; position?: [number, number]; createdAt: string }

interface RequestMapViewProps {
  geometry: any
  className?: string
  /** QA: comments to show as pins on the map */
  comments?: MapComment[]
  /** QA: when true, clicking the map calls onMapClick so user can add a comment at that spot */
  addCommentMode?: boolean
  /** QA: called with lngLat and pixel [x,y] when user clicks map in add-comment mode */
  onMapClick?: (evt: { lngLat: [number, number]; pixel: [number, number] }) => void
  /** QA: when set, show an input overlay at this pixel so user can enter comment text (Figma-style) */
  pendingCommentPixel?: [number, number] | null
  /** QA: save the comment text and clear pending */
  onSaveComment?: (text: string) => void
  /** QA: cancel adding comment */
  onCancelComment?: () => void
}

/** Normalize API geometry to GeoJSON Feature or FeatureCollection for OpenLayers */
function normalizeGeometry(raw: any): any {
  if (!raw || typeof raw !== "object") return null
  if (raw.type === "FeatureCollection") return raw
  if (raw.type === "Feature") return raw
  if (raw.type === "Point" || raw.type === "LineString" || raw.type === "Polygon" || raw.type === "MultiPoint" || raw.type === "MultiLineString" || raw.type === "MultiPolygon") {
    return { type: "Feature", geometry: raw, properties: {} }
  }
  return raw
}

export function RequestMapView({
  geometry,
  className = "",
  comments = [],
  addCommentMode = false,
  onMapClick,
  pendingCommentPixel = null,
  onSaveComment,
  onCancelComment,
}: RequestMapViewProps) {
  const [pendingText, setPendingText] = useState("")
  const mapRef = useRef<Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const overlayRefsRef = useRef<Overlay[]>([])
  const [hasFeatures, setHasFeatures] = useState<boolean | null>(null)
  const [ready, setReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<Map | null>(null)

  useEffect(() => {
    if (!geometry) return
    const el = containerRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) setReady(true)
      else setTimeout(() => setReady(true), 300)
    })
    return () => cancelAnimationFrame(id)
  }, [geometry])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !ready) return

    const raw = typeof geometry === "string" ? (() => { try { return JSON.parse(geometry) } catch { return null } })() : geometry
    const normalized = normalizeGeometry(raw)
    if (!normalized) {
      setHasFeatures(false)
      return
    }
    if (normalized.type === "FeatureCollection" && (!normalized.features || normalized.features.length === 0)) {
      setHasFeatures(false)
      return
    }

    const source = new VectorSource()
    const format = new GeoJSON()

    const tryAdd = (dataProj: string) => {
      try {
        const features = format.readFeatures(normalized, {
          dataProjection: dataProj,
          featureProjection: "EPSG:3857",
        })
        if (features.length > 0) {
          source.addFeatures(features)
          return true
        }
      } catch (_) {}
      try {
        const feature = format.readFeature(normalized, {
          dataProjection: dataProj,
          featureProjection: "EPSG:3857",
        })
        if (feature) {
          source.addFeature(feature)
          return true
        }
      } catch (_) {}
      try {
        const geom = format.readGeometry(normalized.geometry || normalized, {
          dataProjection: dataProj,
          featureProjection: "EPSG:3857",
        })
        if (geom) {
          source.addFeature(new Feature(geom))
          return true
        }
      } catch (_) {}
      return false
    }

    if (!tryAdd("EPSG:4326")) tryAdd("EPSG:3857")

    if (source.getFeatures().length === 0) {
      setHasFeatures(false)
      return
    }

    setHasFeatures(true)

    const vectorLayer = new VectorLayer({
      source,
      style: new Style({
        fill: new Fill({ color: "rgba(37, 99, 235, 0.3)" }),
        stroke: new Stroke({ color: "#2563eb", width: 2 }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#2563eb" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
    })

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        maxZoom: 20,
      }),
    })

    const map = new Map({
      target: el,
      layers: [baseLayer, vectorLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 20,
      }),
    })

    mapRef.current = map

    const extent = source.getExtent()
    if (extent && extent.every((n) => isFinite(n)) && extent[0] !== extent[2] && extent[1] !== extent[3]) {
      map.getView().fit(extent, { padding: [32, 32, 32, 32], maxZoom: 17 })
    } else if (source.getFeatures().length > 0) {
      const feat = source.getFeatures()[0]
      const g = feat.getGeometry()
      if (g) {
        const c = g.getFlatCoordinates()
        if (c.length >= 2) {
          map.getView().setCenter([c[0], c[1]])
          map.getView().setZoom(15)
        }
      }
    }

    const t1 = setTimeout(() => map.updateSize(), 100)
    const t2 = setTimeout(() => map.updateSize(), 500)
    setMapInstance(map)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      map.setTarget(undefined)
      mapRef.current = null
      setMapInstance(null)
    }
  }, [geometry, ready])

  // Add-comment mode: click on map → callback with lngLat and pixel
  useEffect(() => {
    const map = mapInstance
    if (!map || !addCommentMode || !onMapClick) return
    const handler = (evt: any) => {
      const coord = evt.coordinate
      if (!coord) return
      const lngLat = toLonLat(coord) as [number, number]
      const pixel = map.getPixelFromCoordinate(coord)
      if (pixel) onMapClick({ lngLat, pixel: [pixel[0], pixel[1]] })
    }
    map.on("singleclick", handler)
    return () => map.un("singleclick", handler)
  }, [mapInstance, addCommentMode, onMapClick])

  // Comment pins on map (comments with position)
  useEffect(() => {
    const map = mapInstance
    if (!map) return
    overlayRefsRef.current.forEach((o) => map.removeOverlay(o))
    overlayRefsRef.current = []
    const withPosition = (comments || []).filter((c): c is MapComment & { position: [number, number] } => !!c.position && c.position.length >= 2)
    withPosition.forEach((c, i) => {
      const el = document.createElement("div")
      el.className = "comment-pin"
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
      overlayRefsRef.current.push(overlay)
    })
    return () => {
      overlayRefsRef.current.forEach((o) => map.removeOverlay(o))
      overlayRefsRef.current = []
    }
  }, [mapInstance, comments])

  if (geometry == null) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground text-sm ${className}`} style={{ minHeight: 280 }}>
        No map data for this request
      </div>
    )
  }

  if (hasFeatures === false) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground text-sm ${className}`} style={{ minHeight: 280 }}>
        No drawn area in this request
      </div>
    )
  }

  const showPendingInput = pendingCommentPixel && onSaveComment

  return (
    <div
      className={`rounded-lg border bg-muted/20 overflow-hidden relative ${className}`}
      style={{ width: "100%", minHeight: 280, height: 280 }}
    >
      <div
        ref={containerRef}
        role="img"
        aria-label="Request location map"
        className="w-full h-full"
        style={{ minHeight: 280 }}
      />
      {showPendingInput && (
        <div
          className="absolute z-10 bg-background border-2 border-amber-500 rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[220px]"
          style={{ left: pendingCommentPixel[0], top: pendingCommentPixel[1] }}
        >
          <Input
            placeholder="Enter comment..."
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (pendingText.trim()) {
                  onSaveComment(pendingText.trim())
                  setPendingText("")
                }
              }
              if (e.key === "Escape") onCancelComment?.()
            }}
            autoFocus
            className="text-sm"
          />
          <div className="flex gap-1 justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={() => { onCancelComment?.(); setPendingText("") }}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => { if (pendingText.trim()) { onSaveComment(pendingText.trim()); setPendingText("") } }} disabled={!pendingText.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
