"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useFeatureStore } from "@/app/store/useClientStore"
import {
  Ruler,
  MapPin,
  CheckCircle2,
  X,
  AlertTriangle,
  DollarSign,
  Clock,
  Layers,
  Eye,
  EyeOff,
  FileText,
  ChevronLeft,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/** Attentive-style industries */
const TAKEOFF_INDUSTRIES = [
  { value: "landscaping", label: "Landscaping" },
  { value: "paving", label: "Paving" },
  { value: "snow-removal", label: "Snow Removal" },
  { value: "irrigation", label: "Irrigation" },
  { value: "hardscape", label: "Hardscape" },
  { value: "facilities", label: "Facilities Maintenance" },
] as const;

/** Property features by industry (Attentive-style material types) */
const FEATURES_BY_INDUSTRY: Record<string, string[]> = {
  landscaping: [
    "Lawn / Turf",
    "Mulch Bed",
    "Groundcover",
    "Planting Area",
    "Tree Count",
    "Shrub Count",
    "Hedge",
    "Hard Edge",
    "Soft Edge",
    "Rough Mow",
    "Primary Mow",
    "Secondary Mow",
    "Private Sidewalk",
    "Public Sidewalk",
    "Gravel Bed",
  ],
  paving: [
    "Asphalt",
    "Concrete",
    "Curb",
    "Stop Bar",
    "Crosswalk",
    "Parking Stall",
    "Directional Arrow",
    "Pavement",
    "Sidewalk",
    "Gutter",
    "Driveway",
  ],
  "snow-removal": [
    "Drive Lanes",
    "Sidewalk",
    "Pavement",
    "Parking Lot",
    "Driveway",
    "Walkway",
    "Loading Dock",
  ],
  irrigation: [
    "Mainline Pipe",
    "Connection",
    "Gravel",
    "Lawn",
    "Planting Area",
  ],
  hardscape: [
    "Pavement",
    "Driveway",
    "Parking Spot",
    "Sidewalk",
    "Retaining Wall",
    "Patio",
  ],
  facilities: [
    "Pavement",
    "Driveway",
    "Parking",
    "Sidewalk",
    "Landscape Area",
    "Building Footprint",
  ],
};

const DEFAULT_FEATURES = FEATURES_BY_INDUSTRY.landscaping;

export type SurfaceItem = { id: string; label: string; color: string };
export type SurfaceStat = { label: string; color: string; area: number; length?: number };

export default function TakeoffSidebar({
  areaSqft,
  takeoffIndustry,
  onTakeoffIndustryChange,
  selectedFeatures,
  onFeaturesChange,
  surfaces = [],
  activeSurfaceId,
  onActiveSurfaceChange,
  surfaceStats = [],
  onAddSurface,
  onRenameSurface,
  onRemoveSurface,
  onSurfaceColorChange,
  hiddenSurfaceLabels = [],
  onToggleSurfaceVisibility,
  showSurfacesPanel = false,
  surfacesVisible = true,
  onToggleSurfacesVisibility,
  isClientVariant = false,
  propertyAddress = "",
  onPropertyAddressChange,
  onNotMyProperty,
}: {
  areaSqft?: number | string;
  takeoffIndustry?: string;
  onTakeoffIndustryChange?: (v: string) => void;
  selectedFeatures?: string[];
  onFeaturesChange?: (features: string[]) => void;
  surfaces?: SurfaceItem[];
  activeSurfaceId?: string;
  onActiveSurfaceChange?: (id: string) => void;
  surfaceStats?: SurfaceStat[];
  onAddSurface?: () => void;
  onRenameSurface?: (id: string, label: string) => void;
  onRemoveSurface?: (id: string) => void;
  onSurfaceColorChange?: (id: string, color: string) => void;
  hiddenSurfaceLabels?: string[];
  onToggleSurfaceVisibility?: (label: string) => void;
  showSurfacesPanel?: boolean;
  surfacesVisible?: boolean;
  onToggleSurfacesVisibility?: (visible: boolean) => void;
  isClientVariant?: boolean;
  propertyAddress?: string;
  onPropertyAddressChange?: (v: string) => void;
  onNotMyProperty?: () => void;
}) {
  const [takeoffType, setTakeoffType] = useState(takeoffIndustry ?? "landscaping")
  const [features, setFeatures] = useState<string[]>(selectedFeatures ?? ["lawn-turf"])
  const [unit, setUnit] = useState<"sqft" | "acres">("sqft")
  const [activeTab, setActiveTab] = useState<"features" | "sitemap">("features")
  const { openModal, closeModal } = useFeatureStore()
  const [editingSurfaceId, setEditingSurfaceId] = useState<string | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState("")
  const surfaceInputRef = useRef<HTMLInputElement>(null)
  const surfacesLengthRef = useRef(surfaces.length)

  const industry = takeoffIndustry ?? takeoffType
  const featureList = FEATURES_BY_INDUSTRY[industry] || DEFAULT_FEATURES

  useEffect(() => {
    if (surfaces.length > surfacesLengthRef.current) {
      const last = surfaces[surfaces.length - 1]
      if (last) {
        setEditingSurfaceId(last.id)
        setEditingLabelValue(last.label)
      }
    }
    surfacesLengthRef.current = surfaces.length
  }, [surfaces.length, surfaces])

  useEffect(() => {
    if (editingSurfaceId) surfaceInputRef.current?.focus()
  }, [editingSurfaceId])

  const setIndustry = (v: string) => {
    setTakeoffType(v)
    onTakeoffIndustryChange?.(v)
    setFeatures([])
    onFeaturesChange?.([])
  }

  const toggleFeature = (f: string) => {
    const key = f.toLowerCase().replace(/\s+/g, "-")
    const next = features.includes(key)
      ? features.filter((x) => x !== key)
      : [...features, key]
    setFeatures(next)
    onFeaturesChange?.(next)
  }

  const sqft = Number(areaSqft) || 0
  const displayValue = unit === "sqft"
    ? sqft.toLocaleString()
    : (sqft / 43560).toFixed(2)
  const acres = sqft > 0 ? (sqft / 43560).toFixed(1) : "0"

  // Client variant: Takeoff Details layout (image-style)
  if (isClientVariant) {
    return (
      <div className="w-[360px] bg-card border-r border-border flex flex-col overflow-hidden h-full">
        {/* Header: Takeoff Details + Location */}
        <div className="p-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold text-foreground">Takeoff Details</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Collapse">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <Input
              placeholder="Enter property address"
              value={propertyAddress}
              onChange={(e) => onPropertyAddressChange?.(e.target.value)}
              className="h-9 border-0 bg-transparent p-0 text-primary font-medium text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Lot Area: green bar + value */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">Lot Area</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">{displayValue}</span>
              <Select value={unit} onValueChange={(v: "sqft" | "acres") => setUnit(v)}>
                <SelectTrigger className="w-[72px] h-7 text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">sqft</SelectItem>
                  <SelectItem value="acres">acres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Surfaces / Property features: show-hide + list with area analysis */}
        <div className="px-5 py-3 border-b border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Zones</span>
            <Badge variant="secondary">{surfaces?.length ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">Show/Hide all property-features</Label>
            {onToggleSurfacesVisibility && (
              <Switch
                checked={surfacesVisible}
                onCheckedChange={onToggleSurfacesVisibility}
                aria-label="Show or hide all property features on map"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Surfaces</span>
            <span>Area (sqft)</span>
          </div>
          {activeSurfaceId && (surfaces ?? []).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Drawing as: <span className="font-medium text-foreground">{(surfaces ?? []).find((s) => s.id === activeSurfaceId)?.label ?? "—"}</span>
            </p>
          )}
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            {(surfaces ?? []).map((s) => {
              const stat = surfaceStats?.find((st) => st.label === s.label)
              const area = stat?.area ?? 0
              const isActive = activeSurfaceId === s.id
              const isHidden = hiddenSurfaceLabels?.includes(s.label)
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onActiveSurfaceChange?.(s.id)}
                  onKeyDown={(e) => e.key === "Enter" && onActiveSurfaceChange?.(s.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                    isActive ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-border hover:bg-muted/50",
                    isHidden && "opacity-60"
                  )}
                >
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => {
                      e.stopPropagation()
                      onSurfaceColorChange?.(s.id, e.target.value)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded cursor-pointer border border-border shrink-0"
                    title="Change color"
                  />
                  <span className="text-sm font-medium truncate flex-1">{s.label}</span>
                  <span className="text-sm tabular-nums shrink-0">{area.toLocaleString()}</span>
                  {onToggleSurfaceVisibility && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSurfaceVisibility(s.label)
                      }}
                      title={isHidden ? `Show ${s.label}` : `Hide ${s.label}`}
                      aria-label={isHidden ? `Show ${s.label}` : `Hide ${s.label}`}
                    >
                      {isHidden ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          {onAddSurface && (
            <Button variant="outline" size="sm" className="w-full" onClick={onAddSurface}>
              Add a new group of property-features
            </Button>
          )}
        </div>

        {/* Orange disclaimer */}
        <div className="mx-5 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex gap-2 shrink-0">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-100">
            Al-Measure will not make any modifications or adjustments to the lot boundaries or parcels that you have edited or drawn.
          </p>
        </div>

        {/* Service / Takeoff type */}
        <div className="px-5 py-3 shrink-0">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
            <FileText className="h-3.5 w-3.5" />
            Service type
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TAKEOFF_INDUSTRIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs: Property Features | Sitemap & Instructions */}
        <div className="px-5 flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "features" | "sitemap")} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="features" className="text-xs">Property Features</TabsTrigger>
              <TabsTrigger value="sitemap" className="text-xs">Sitemap & Instructions</TabsTrigger>
            </TabsList>
            <TabsContent value="features" className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden">
              <p className="text-xs text-muted-foreground mb-2">Property features included in this takeoff type</p>
              <div className="grid grid-cols-1 gap-1.5">
                {featureList.slice(0, 12).map((f) => {
                  const key = f.toLowerCase().replace(/\s+/g, "-")
                  return (
                    <label
                      key={f}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-md border cursor-pointer transition-colors",
                        features.includes(key)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={features.includes(key)}
                        onCheckedChange={() => toggleFeature(key)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{f}</span>
                    </label>
                  )
                })}
              </div>
            </TabsContent>
            <TabsContent value="sitemap" className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground">Instructions and sitemap details can be added here.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Summary: beige box */}
        <div className="mx-5 my-3 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-border shrink-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Lot Area: {displayValue} sqft{sqft > 0 ? ` (${acres} acres)` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Price: —</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Estimated processing: —</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 border-t border-border space-y-2 shrink-0 bg-muted/30">
          <Button className="w-full h-11 bg-primary hover:bg-primary/90" onClick={openModal}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirm Lot Boundary and Review Takeoff
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 text-muted-foreground hover:text-destructive"
              onClick={onNotMyProperty}
            >
              Not My Property
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default (employee) variant
  return (
    <div className="w-[380px] bg-card border-r border-border h-screen flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Ruler className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Takeoff Details</h2>
            <p className="text-xs text-muted-foreground">Configure your measurement</p>
          </div>
        </div>

        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Lot Area</span>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Active</Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{displayValue}</span>
              <Select value={unit} onValueChange={(v: "sqft" | "acres") => setUnit(v)}>
                <SelectTrigger className="w-[80px] h-8 text-xs border-emerald-300 dark:border-emerald-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">sq ft</SelectItem>
                  <SelectItem value="acres">acres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Property-features: Show/Hide + Surfaces list (colors match map shapes) */}
        {showSurfacesPanel && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-semibold text-foreground leading-none">
                Show/Hide all property-features
              </Label>
              {onToggleSurfacesVisibility && (
                <Switch
                  checked={surfacesVisible}
                  onCheckedChange={onToggleSurfacesVisibility}
                  aria-label="Show or hide all property features on map"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Each color below matches the shapes on the map. Select a group, then draw to add area.
            </p>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Surfaces</span>
              <span>Area (sqft)</span>
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {surfaces.map((s) => {
                const stat = surfaceStats.find((st) => st.label === s.label)
                const area = stat?.area ?? 0
                const isActive = activeSurfaceId === s.id
                const isHidden = hiddenSurfaceLabels.includes(s.label)
                const isEditing = editingSurfaceId === s.id
                const commitEdit = () => {
                  const value = (isEditing ? editingLabelValue : s.label).trim()
                  if (value && onRenameSurface) onRenameSurface(s.id, value)
                  setEditingSurfaceId(null)
                  setEditingLabelValue("")
                }
                return (
                  <div
                    key={s.id}
                    onClick={() => !isEditing && onActiveSurfaceChange?.(s.id)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors",
                      isActive ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-border hover:bg-muted/50",
                      isHidden && "opacity-60"
                    )}
                  >
                    {onSurfaceColorChange ? (
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => {
                          e.stopPropagation()
                          onSurfaceColorChange(s.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded cursor-pointer border-2 border-white shadow-sm shrink-0"
                        title="Change color – shapes on map update with transparent fill"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded shrink-0 border-2 border-white shadow-sm"
                        style={{ backgroundColor: s.color }}
                        title={`${s.label} – same color on map`}
                      />
                    )}
                    {isEditing ? (
                      <Input
                        ref={surfaceInputRef}
                        className="h-8 flex-1 text-sm"
                        value={editingLabelValue}
                        onChange={(e) => setEditingLabelValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") commitEdit()
                          if (e.key === "Escape") {
                            setEditingSurfaceId(null)
                            setEditingLabelValue("")
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {s.label}
                      </span>
                    )}
                    {onToggleSurfaceVisibility && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleSurfaceVisibility(s.label)
                        }}
                        title={isHidden ? `Show ${s.label} on map` : `Hide ${s.label} on map`}
                        aria-label={isHidden ? `Show ${s.label} on map` : `Hide ${s.label} on map`}
                      >
                        {isHidden ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                    {onRemoveSurface && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveSurface(s.id)
                        }}
                        title="Delete surface and all its shapes"
                        aria-label="Delete surface"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onRenameSurface && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSurfaceId(s.id)
                          setEditingLabelValue(s.label)
                        }}
                        title="Rename"
                        aria-label="Rename surface"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <span className="text-sm tabular-nums text-muted-foreground min-w-[4rem] text-right">
                      {area.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
            {onAddSurface && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={onAddSurface}
              >
                <Layers className="h-4 w-4" />
                Add a new group of property-features
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            Al-Measure will not modify any lot boundaries or parcels that you have edited or drawn.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Takeoff Type
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select takeoff type" />
            </SelectTrigger>
            <SelectContent>
              {TAKEOFF_INDUSTRIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">
              Property Features
            </Label>
            <Badge variant="outline" className="text-xs">
              {features.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {featureList.map((f) => {
              const key = f.toLowerCase().replace(/\s+/g, "-")
              return (
                <div
                  key={f}
                  className="flex items-center gap-2.5 p-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleFeature(key)}
                >
                  <Checkbox
                    checked={features.includes(key)}
                    onCheckedChange={() => toggleFeature(key)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Summary</Label>
          <Card className="border border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  <span>Lot Area</span>
                </div>
                <span className="font-semibold">{areaSqft} sq ft</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Estimated Price</span>
                </div>
                <span className="font-semibold">TBD</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated Time</span>
                </div>
                <span className="font-semibold">TBD</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 border-t border-border space-y-2 bg-muted/30">
        <Button className="w-full h-11 gap-2" onClick={openModal}>
          <CheckCircle2 className="h-4 w-4" />
          Confirm & Review Takeoff
        </Button>
        <Button variant="outline" className="w-full h-11" onClick={closeModal}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          variant="ghost"
          className="w-full h-11 text-destructive hover:bg-destructive/10"
          onClick={onNotMyProperty}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Not My Property
        </Button>
      </div>
    </div>
  )
}
