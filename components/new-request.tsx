"use client"

import { useCallback, useState } from "react"
import MapApp from "@/components/map-app"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFeatureStore } from "@/app/store/useClientStore"
import { useStore } from "@/lib/store"
import { RequestCategory } from "@/lib/task-types"
import { Label } from "./ui/label"
import { RequestPriority, ServiceRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { MapPin, FileText, Tag, AlertCircle, CheckCircle2, Ruler } from "lucide-react"
import { Badge } from "./ui/badge"
import { toast } from "sonner"

export default function NewRequest() {
  const { addRequest } = useStore()
  const [pendingFeature, setPendingFeature] = useState<any | null>(null)
  const [areaSqft, setAreaSqft] = useState<number | string>("")
  const { isOpen, closeModal } = useFeatureStore()
  
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
  }

  const submitTask = useCallback(() => {
    if (!pendingFeature) {
      toast.error("Please draw a measurement on the map first")
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

    const newRequest: ServiceRequest = {
      id: crypto.randomUUID(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      status: "pending",
      geometry: pendingFeature,
      clientName: formData.clientName || "Unknown Client",
      clientEmail: formData.clientEmail || "",
      propertyAddress: formData.propertyAddress || "Not specified",
      propertySize: areaSqft,
      propertyFeatures: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: formData.notes,
      attachments: [],
    }

    // addRequest(newRequest)
    console.log('newRequest',newRequest)
    // toast.success("Request submitted successfully!", {
    //   description: `Your ${formData.category} request has been created.`
    // })
    
    // closeModal()
    // resetForm()
  }, [pendingFeature, formData, areaSqft, addRequest, closeModal])

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
    <div className="space-y-4">
      {/* Map Card */}
      <Card className="border-2 shadow-sm p-0">
        {/* <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Measurement Map</CardTitle>
              <CardDescription>Draw your property boundaries and measurements</CardDescription>
            </div>
            {areaSqft && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-base px-3 py-1">
                <Ruler className="h-4 w-4 mr-1.5" />
                {areaSqft} sq ft
              </Badge>
            )}
          </div>
        </CardHeader> */}
        <CardContent className="p-0">
          <div className="bg-gray-50 dark:bg-gray-900 min-h-[500px]">
            <MapApp 
              onFeatureDrawn={onFeatureDrawn} 
              userRole="client" 
              getAreaSqft={getAreaSqft} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Request Submission Dialog */}
      <Dialog open={isOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">Submit Measurement Request</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit your property measurement request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Request Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Request Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Commercial Property Landscape Measurement"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="h-11 text-base"
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
              <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Property Address
              </Label>
              <Input
                id="address"
                placeholder="Enter property address"
                value={formData.propertyAddress}
                onChange={(e) => handleChange("propertyAddress", e.target.value)}
                className="h-11 text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your measurement request, including specific requirements, special considerations, or any additional context..."
                rows={5}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="text-base resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or special instructions..."
                rows={3}
                value={formData.notes}
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
              disabled={!formData.title.trim() || !formData.description.trim() || !pendingFeature}
              className="h-11 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
