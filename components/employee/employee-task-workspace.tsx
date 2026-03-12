"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MapApp from "@/components/map-app"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
  FileText,
  Ruler,
  MessageSquareWarning,
  Eye,
  EyeOff,
} from "lucide-react"
import type { ServiceRequest, TakeoffItem } from "@/lib/types"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import { toast } from "sonner"
import { useFeatureStore } from "@/app/store/useClientStore"

const MEASUREMENT_KINDS = [
  { value: "tree-count", label: "Tree count", takeoffType: "point" as const, unit: "count" },
  { value: "road-length", label: "Road length", takeoffType: "line" as const, unit: "ft" },
  { value: "fence-length", label: "Fence length", takeoffType: "line" as const, unit: "ft" },
  { value: "other-length", label: "Other length", takeoffType: "line" as const, unit: "ft" },
  { value: "other-count", label: "Other count", takeoffType: "point" as const, unit: "count" },
]

interface EmployeeTaskWorkspaceProps {
  request: ServiceRequest
  onBack: () => void
  onRequestUpdated: (req: ServiceRequest) => void
}

export function EmployeeTaskWorkspace({
  request,
  onBack,
  onRequestUpdated,
}: EmployeeTaskWorkspaceProps) {
  const { clearFeatures } = useFeatureStore()
  const [localRequest, setLocalRequest] = useState(request)
  const [mapGeometry, setMapGeometry] = useState<{ type: "FeatureCollection"; features: any[] } | null>(null)
  const [mapTakeoffItems, setMapTakeoffItems] = useState<TakeoffItem[]>(request.takeoffItems ?? [])
  const [formTakeoffItems, setFormTakeoffItems] = useState<TakeoffItem[]>([])
  const [saving, setSaving] = useState(false)
  const [submittingQa, setSubmittingQa] = useState(false)
  const [newKind, setNewKind] = useState(MEASUREMENT_KINDS[0].value)
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")
  const [showCommentsOnMap, setShowCommentsOnMap] = useState(true)

  useEffect(() => {
    clearFeatures()
  }, [clearFeatures])

  const req = localRequest
  const takeoffItems = [...mapTakeoffItems, ...formTakeoffItems]

  const handleAddMeasurement = () => {
    const kind = MEASUREMENT_KINDS.find((k) => k.value === newKind)
    if (!kind) return
    const label = newLabel.trim() || kind.label
    const num = parseFloat(newValue)
    if (Number.isNaN(num) || num < 0) {
      toast.error("Enter a valid number")
      return
    }
    const item: TakeoffItem = {
      id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      label,
      type: kind.takeoffType,
      unit: kind.unit,
      ...(kind.takeoffType === "point" ? { length: num } : { length: num }),
    }
    if (kind.unit === "count") (item as any).area = undefined
    setFormTakeoffItems((prev) => [...prev, item])
    setNewLabel("")
    setNewValue("")
  }

  const handleRemoveItem = (id: string) => {
    if (id.startsWith("emp-")) {
      setFormTakeoffItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      setMapTakeoffItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const handleSaveMeasurements = async () => {
    if (!req.id) return
    setSaving(true)
    try {
      const geometry = mapGeometry ?? req.geometry
      const payload: { takeoffItems: TakeoffItem[]; geometry?: any } = { takeoffItems }
      if (geometry) payload.geometry = geometry
      const { data } = await http.put(
        endpoints.requestById(req.id),
        payload,
        { withCredentials: true }
      )
      setLocalRequest(data.data)
      onRequestUpdated(data.data)
      toast.success("Measurements saved")
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitToQa = async () => {
    if (!req.id) return
    setSubmittingQa(true)
    try {
      const geometry = mapGeometry ?? req.geometry
      const payload: { status: string; takeoffItems: TakeoffItem[]; geometry?: any } = {
        status: "pending-qa",
        takeoffItems,
      }
      if (geometry) payload.geometry = geometry
      const { data } = await http.put(
        endpoints.requestById(req.id),
        payload,
        { withCredentials: true }
      )
      setLocalRequest(data.data)
      onRequestUpdated(data.data)
      toast.success("Submitted to QA")
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to submit to QA")
    } finally {
      setSubmittingQa(false)
    }
  }

  const canSubmitQa = req.status === "in-progress" || req.status === "pending" || req.status === "qa-approved"
  const hasUnsavedChanges =
    JSON.stringify(takeoffItems) !== JSON.stringify(request.takeoffItems ?? []) ||
    (mapGeometry !== null && JSON.stringify(mapGeometry) !== JSON.stringify(request.geometry))
  const hasQaFeedback = !!(req.qaFeedback?.trim() || (req.qaComments?.length ?? 0) > 0)
  const hasCommentsOnMap = (req.qaComments ?? []).some((c) => c.position && c.position.length >= 2)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-4 shrink-0 py-2">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2 shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg tracking-tight truncate">{req.title}</h1>
          <p className="text-muted-foreground text-xs font-mono truncate">{req.id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasUnsavedChanges && (
            <Button size="sm" variant="secondary" onClick={handleSaveMeasurements} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          )}
          {canSubmitQa && (
            <Button size="sm" onClick={handleSubmitToQa} disabled={submittingQa}>
              {submittingQa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit to QA
            </Button>
          )}
          {hasCommentsOnMap && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowCommentsOnMap((v) => !v)}
            >
              {showCommentsOnMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showCommentsOnMap ? "Hide comments on map" : "Show comments on map"}
            </Button>
          )}
        </div>
      </div>

      {/* QA feedback / rework notice */}
      {hasQaFeedback && (
        <Card className="shrink-0 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2">
              <MessageSquareWarning className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">QA feedback – please rework</p>
                {req.qaFeedback?.trim() && (
                  <p className="text-amber-800 dark:text-amber-200">{req.qaFeedback}</p>
                )}
                {(req.qaComments?.length ?? 0) > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-200">
                    {req.qaComments!.map((c) => (
                      <li key={c.id}>{c.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full-screen map + tools */}
      <Card className="flex-1 min-h-0 border-2 shadow-sm overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          <div className="bg-muted/30 flex-1 min-h-0 w-full flex flex-col">
            <MapApp
              userRole="employee"
              initialGeometry={req.geometry}
              takeoffIndustry={req.takeoffIndustry ?? "landscaping"}
              onGeometryChange={(geometry, takeoffFromMap) => {
                setMapGeometry(geometry)
                setMapTakeoffItems(takeoffFromMap)
              }}
              commentPins={req.qaComments ?? []}
              showCommentPins={showCommentsOnMap}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Add measurements (quick add)
              </CardTitle>
              <CardDescription>
                Add tree count, road length, etc. Or use the map tools above to draw polygons, lines, and points.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1.5 min-w-[140px]">
                  <Label className="text-xs">Type</Label>
                  <Select value={newKind} onValueChange={setNewKind}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-[160px]">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    className="h-9"
                    placeholder="e.g. North road"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 min-w-[100px]">
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="h-9"
                    placeholder="0"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </div>
                <Button size="sm" className="gap-1.5 h-9" onClick={handleAddMeasurement}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Final measurements
              </CardTitle>
              <CardDescription>From map + quick add. Save to update the request file.</CardDescription>
            </CardHeader>
            <CardContent>
              {takeoffItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No measurements yet. Draw on the map or add above.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Label</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-right p-2 font-medium">Value</th>
                        <th className="w-10 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {takeoffItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.label}</td>
                          <td className="p-2">{item.type}</td>
                          <td className="p-2 text-right">
                            {item.length != null ? item.length : item.area ?? "—"} {item.unit}
                          </td>
                          <td className="p-2">
                            {item.id.startsWith("emp-") ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Use map Delete tool</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{req.description}</p>
              <p><span className="text-muted-foreground">Category:</span> {req.category?.replace(/-/g, " ")}</p>
              <p><span className="text-muted-foreground">Priority:</span> {req.priority}</p>
              <p><span className="text-muted-foreground">Status:</span> {req.status.replace(/-/g, " ")}</p>
              {req.propertyAddress && (
                <p><span className="text-muted-foreground">Address:</span> {req.propertyAddress}</p>
              )}
              {req.propertySize && (
                <p><span className="text-muted-foreground">Lot area:</span> {req.propertySize} sq ft</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
