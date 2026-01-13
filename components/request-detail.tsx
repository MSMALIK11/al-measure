"use client"

import type { ServiceRequest, RequestUpdate } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RequestDetailProps {
  request: ServiceRequest
  updates: RequestUpdate[]
  onBack: () => void
  onUpdateStatus: (status: ServiceRequest["status"]) => void
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
}

const categoryLabels = {
  "landscape-measurement": "Landscape Measurement",
  "property-assessment": "Property Assessment",
  "maintenance-request": "Maintenance Request",
  consultation: "Consultation",
  other: "Other",
}

export function RequestDetail({ request, updates, onBack, onUpdateStatus }: RequestDetailProps) {
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

          {/* Quick Actions */}
          {request.status !== "completed" && request.status !== "cancelled" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status === "pending" && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => onUpdateStatus("in-progress")}
                  >
                    Mark as In Progress
                  </Button>
                )}
                {/* {request.status === "in-progress" && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => onUpdateStatus("completed")}
                  >
                    Mark as Completed
                  </Button>
                )} */}
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
