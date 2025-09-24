"use client"

import { useEffect, useRef } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import XYZ from "ol/source/XYZ"
import VectorSource from "ol/source/Vector"
import { Draw } from "ol/interaction"
import { Style, Fill, Stroke } from "ol/style"
import GeoJSON from "ol/format/GeoJSON"
import "ol/ol.css"

export default function MapApp({ onFeatureDrawn }: { onFeatureDrawn?: (f: any) => void }) {
  const mapRef = useRef<Map | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // base OSM layer
    const base = new TileLayer({
      source: new XYZ({
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attributions: "© OSM",
      }),
    })

    // vector layer for drawings
    const source = new VectorSource()
    const vector = new VectorLayer({
      source,
      style: new Style({
        stroke: new Stroke({ color: "#4a80f5", width: 2 }),
        fill: new Fill({ color: "rgba(74,128,245,0.2)" }),
      }),
    })

    const map = new Map({
      target: containerRef.current,
      layers: [base, vector],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    })

    // Draw interaction
    const draw = new Draw({
      source,
      type: "Polygon",
    })
    map.addInteraction(draw)

    draw.on("drawend", (event) => {
      const feature = event.feature
      const geojson = new GeoJSON().writeFeatureObject(feature, {
        featureProjection: "EPSG:3857",
      })
      if (onFeatureDrawn) onFeatureDrawn(geojson)
    })

    mapRef.current = map
    sourceRef.current = source

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [onFeatureDrawn])

  return <div ref={containerRef} className="w-full h-full" />
}
