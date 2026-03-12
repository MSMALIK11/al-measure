"use client"

import type { ServiceRequest, RequestUpdate } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, FileText, AlertCircle, Download, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadCSV, printRequest } from "@/lib/export-utils"
import { toast } from "sonner"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"

interface RequestDetailProps {
  request: ServiceRequest
  updates: RequestUpdate[]
  onBack: () => void
  onUpdateStatus: (status: ServiceRequest["status"]) => void
  onRequestUpdated?: (request: ServiceRequest) => void
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200",
  "pending-qa": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
  "qa-approved": "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-200",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
}

const categoryLabels: Record<string, string> = {
  "landscape-measurement": "Landscape Measurement",
  "property-assessment": "Property Assessment",
  "maintenance-request": "Maintenance Request",
  consultation: "Consultation",
  paving: "Paving",
  "snow-removal": "Snow Removal",
  irrigation: "Irrigation",
  hardscape: "Hardscape",
  other: "Other",
}

export function RequestDetail({ request, updates, onBack, onUpdateStatus, onRequestUpdated }: RequestDetailProps) {
  const handleExportPDF = () => printRequest(request)
  const handleExportCSV = () => downloadCSV(request)
  const handleShareLink = async () => {
    try {
      const { data } = await http.post(endpoints.requestShare(request.id!), {}, { withCredentials: true })
      const url = data.shareUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/share/${data.shareToken}`
      await navigator.clipboard.writeText(url)
      toast.success("Share link copied to clipboard")
      if (onRequestUpdated && data.data) onRequestUpdated({ ...request, shareToken: data.shareToken })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to create share link")
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{request.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Priority */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("font-medium text-sm", statusColors[request.status])}>
                  {request.status.replace("-", " ")}
                </Badge>
                <Badge variant="outline" className={cn("font-medium text-sm", priorityColors[request.priority])}>
                  {request.priority} priority
                </Badge>
                <Badge variant="outline" className="font-normal text-sm">
                  {categoryLabels[request.category]}
                </Badge>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">{request.description}</p>
              </div>

              {request.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Additional Notes
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{request.notes}</p>
                  </div>
                </>
              )}

              {/* Takeoff items (Attentive-style measurements) */}
              {(request.takeoffItems?.length ?? 0) > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Takeoff Summary
                    </h3>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2">Label</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-right p-2">Area (sq ft)</th>
                            <th className="text-right p-2">Length (ft)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {request.takeoffItems!.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-2">{item.label}</td>
                              <td className="p-2">{item.type}</td>
                              <td className="p-2 text-right">{item.area ?? ""}</td>
                              <td className="p-2 text-right">{item.length ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates yet</p>
                ) : (
                  <div className="relative space-y-4 pl-6 border-l-2 border-muted">
                    {updates.map((update) => (
                      <div key={update.id} className="relative">
                        <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs", statusColors[update.status])}>
                              {update.status.replace("-", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(update.timestamp)}</span>
                          </div>
                          <p className="text-sm">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Name</span>
                </div>
                <p className="text-sm font-medium">{request.clientName}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-sm font-medium break-all">{request.clientEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Address</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{request.propertyAddress}</p>
              </div>

              {request.propertySize && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Size</span>
                    </div>
                    <p className="text-sm font-medium">{request.propertySize}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Submitted</span>
                </div>
                <p className="text-sm font-medium">{formatDateShort(request.createdAt)}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Last Updated</span>
                </div>
                <p className="text-sm font-medium">{formatDateShort(request.updatedAt)}</p>
              </div>

              {request.estimatedCompletion && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Est. Completion</span>
                    </div>
                    <p className="text-sm font-medium">{formatDateShort(request.estimatedCompletion)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export & Share (Attentive-style bid-ready outputs) */}
          <Card>
            <CardHeader>
              <CardTitle>Export & Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportPDF}>
                <Download className="h-4 w-4" />
                Export as PDF
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export as CSV / Excel
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleShareLink}>
                <Share2 className="h-4 w-4" />
                {request.shareToken ? "Copy share link" : "Create share link"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions & QA workflow */}
          {request.status !== "completed" && request.status !== "cancelled" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => onUpdateStatus("pending-qa")}
                    >
                      Submit for QA Review
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => onUpdateStatus("in-progress")}
                    >
                      Mark as In Progress
                    </Button>
                  </>
                )}
                {request.status === "pending-qa" && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => onUpdateStatus("qa-approved")}
                  >
                    QA Approved
                  </Button>
                )}
                {(request.status === "qa-approved" || request.status === "in-progress") && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => onUpdateStatus("completed")}
                  >
                    Mark as Completed
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive bg-transparent"
                  onClick={() => onUpdateStatus("cancelled")}
                >
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
