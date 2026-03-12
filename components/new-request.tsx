"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import MapApp from "@/components/map-app"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFeatureStore } from "@/app/store/useClientStore"
import { RequestCategory } from "@/lib/task-types"
import { Label } from "./ui/label"
import { RequestPriority, TakeoffItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { MapPin, FileText, Tag, AlertCircle, CheckCircle2, Ruler } from "lucide-react"
import { toast } from "sonner"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"

export default function NewRequest() {
  const router = useRouter()
  const { features, clearFeatures, isOpen, closeModal } = useFeatureStore()
  const [pendingFeature, setPendingFeature] = useState<any | null>(null)
  const [areaSqft, setAreaSqft] = useState<number | string>("")
  const [takeoffIndustry, setTakeoffIndustry] = useState<string>("landscaping")
  const [propertyFeatures, setPropertyFeatures] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "landscape-measurement" as RequestCategory,
    priority: "medium" as RequestPriority,
    clientName: "",
    clientEmail: "",
    propertyAddress: "",
    propertySize: "",
    notes: "",
  })

  const onFeatureDrawn = useCallback((feature: any) => {
    setPendingFeature(feature)
  }, [])

  const getAreaSqft = (area: string) => {
    setAreaSqft(parseFloat(area))
    setFormData((prev) => ({ ...prev, propertySize: area }))
  }

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value ?? "" }))
  }, [])

  const resetForm = () => {
    setPendingFeature(null)
    setAreaSqft("")
    setFormData({
      title: "",
      description: "",
      category: "landscape-measurement" as RequestCategory,
      priority: "medium" as RequestPriority,
      clientName: "",
      clientEmail: "",
      propertyAddress: "",
      propertySize: "",
      notes: "",
    })
    clearFeatures()
  }

  const submitTask = useCallback(async () => {
    const hasMeasurement = pendingFeature || features.length > 0
    if (!hasMeasurement) {
      toast.error("Please draw or select a measurement on the map first")
      return
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a request title")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description")
      return
    }

    const takeoffItems: TakeoffItem[] = features.map((f, i) => ({
      id: f.id,
      label: f.type === "Polygon" ? `Area ${i + 1}` : f.type === "Line" ? `Length ${i + 1}` : `Point ${i + 1}`,
      type: f.type === "Polygon" ? "polygon" : f.type === "Line" ? "line" : "point",
      area: f.area,
      length: f.length,
      unit: f.unit || "sq ft",
    }))

    setSubmitting(true)
    try {
      const { data } = await http.post(endpoints.requests, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        takeoffIndustry: takeoffIndustry || undefined,
        priority: formData.priority,
        geometry: pendingFeature || { type: "FeatureCollection", features: [] },
        takeoffItems: takeoffItems.length ? takeoffItems : undefined,
        clientName: formData.clientName || "Unknown Client",
        clientEmail: formData.clientEmail || "",
        propertyAddress: formData.propertyAddress || "Not specified",
        propertySize: areaSqft,
        propertyFeatures: propertyFeatures,
        notes: formData.notes || undefined,
        attachments: [],
      }, { withCredentials: true })
      toast.success("Request submitted successfully!", {
        description: "Your takeoff request has been created.",
      })
      closeModal()
      resetForm()
      router.push("/client")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }, [pendingFeature, formData, areaSqft, takeoffIndustry, propertyFeatures, features, closeModal, router])

  const categoryIcons = {
    "landscape-measurement": Ruler,
    "property-assessment": MapPin,
    "maintenance-request": AlertCircle,
    "consultation": FileText,
    "other": Tag,
  }

  const priorityColors = {
    low: "text-gray-600 bg-gray-100",
    medium: "text-blue-600 bg-blue-100",
    high: "text-orange-600 bg-orange-100",
    urgent: "text-red-600 bg-red-100",
  }

 
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] min-h-[560px]">
      <Card className="flex-1 min-h-0 flex flex-col border border-border shadow-sm p-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="h-full bg-muted/30">
            <MapApp
              onFeatureDrawn={onFeatureDrawn}
              userRole="client"
              getAreaSqft={getAreaSqft}
              takeoffIndustry={takeoffIndustry}
              onTakeoffIndustryChange={setTakeoffIndustry}
              selectedFeatures={propertyFeatures}
              onFeaturesChange={setPropertyFeatures}
              propertyAddress={formData.propertyAddress ?? ""}
              onPropertyAddressChange={(v) => handleChange("propertyAddress", v)}
              onNotMyProperty={() => {
                resetForm()
                router.push("/client")
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Request Submission Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            const firstInput = document.getElementById("modal-title")
            if (firstInput) (firstInput as HTMLInputElement).focus()
          }}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest("[data-slot=select-content]")) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest("[data-slot=select-content]")) e.preventDefault()
          }}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">Submit Measurement Request</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit your property measurement request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Request Title */}
            <div className="space-y-2">
              <Label htmlFor="modal-title" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Request Title *
              </Label>
              <Input
                id="modal-title"
                type="text"
                placeholder="e.g., Commercial Property Landscape Measurement"
                value={formData.title ?? ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="h-11 text-base"
                autoComplete="off"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape-measurement">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Landscape Measurement
                      </div>
                    </SelectItem>
                    <SelectItem value="property-assessment">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Property Assessment
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance-request">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Maintenance Request
                      </div>
                    </SelectItem>
                    <SelectItem value="consultation">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Consultation
                      </div>
                    </SelectItem>
                    <SelectItem value="paving">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Paving
                      </div>
                    </SelectItem>
                    <SelectItem value="snow-removal">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Snow Removal
                      </div>
                    </SelectItem>
                    <SelectItem value="irrigation">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Irrigation
                      </div>
                    </SelectItem>
                    <SelectItem value="hardscape">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Hardscape
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Priority *
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger id="priority" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="modal-address" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Property Address
              </Label>
              <Input
                id="modal-address"
                type="text"
                placeholder="Enter property address"
                value={formData.propertyAddress ?? ""}
                onChange={(e) => handleChange("propertyAddress", e.target.value)}
                className="h-11 text-base"
                autoComplete="street-address"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="modal-description" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description *
              </Label>
              <Textarea
                id="modal-description"
                placeholder="Provide detailed information about your measurement request, including specific requirements, special considerations, or any additional context..."
                rows={5}
                value={formData.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="text-base resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="modal-notes" className="text-base font-semibold">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="modal-notes"
                placeholder="Add any additional notes or special instructions..."
                rows={3}
                value={formData.notes ?? ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="text-base resize-none"
              />
            </div>

            {/* Measurement Summary */}
            {areaSqft && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Measurement Captured</span>
                </div>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">
                  Area: <span className="font-mono font-bold">{areaSqft} sq ft</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { closeModal(); resetForm(); }} className="h-11">
              Cancel
            </Button>
            <Button
              onClick={submitTask}
              disabled={
                !formData.title.trim() ||
                !formData.description.trim() ||
                (!pendingFeature && features.length === 0) ||
                submitting
              }
              className="h-11 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
