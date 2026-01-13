"use client"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, MapPin, User, Mail, Package, Zap } from "lucide-react"
import type { ServiceRequest } from "@/lib/types"

interface AdminRequestDetailProps {
  request: ServiceRequest
  onBack: () => void
}

export function AdminRequestDetail({ request, onBack }: AdminRequestDetailProps) {
  const {
    updateRequest,
    users,
    assignRequestToEmployee,
    requestUpdates,
    addRequestUpdate,
    autoAssignRequest,
    getAvailableEmployees,
  } = useStore()

  const assignedUser = request.assignedTo ? users.find((u) => u.id === request.assignedTo) : null
  const employees = users.filter((u) => u.role === "employee")
  const updates = requestUpdates[request.id] || []
  const availableEmployees = getAvailableEmployees()

  const handleStatusChange = (status: ServiceRequest["status"]) => {
    if (status === "in-progress" && !request.assignedTo) {
      const assigned = autoAssignRequest(request.id)
      if (assigned) {
        updateRequest(request.id, { status })
        return
      }
    }

    updateRequest(request.id, { status })

    const statusMessages = {
      pending: "Request status changed to pending",
      "in-progress": "Request is now being processed",
      completed: "Request has been completed successfully",
      cancelled: "Request has been cancelled",
    }

    addRequestUpdate(request.id, {
      id: `update-${Date.now()}`,
      requestId: request.id,
      status,
      message: statusMessages[status],
      timestamp: new Date().toISOString(),
    })
  }

  const handleAssignEmployee = (employeeId: string) => {
    const employee = users.find((u) => u.id === employeeId)
    if (!employee) return

    assignRequestToEmployee(request.id, employeeId)
    addRequestUpdate(request.id, {
      id: `update-${Date.now()}`,
      requestId: request.id,
      status: request.status,
      message: `Assigned to ${employee.name}`,
      timestamp: new Date().toISOString(),
    })
  }

  const handleAutoAssign = () => {
    const assigned = autoAssignRequest(request.id)
    if (!assigned) {
      alert("No available employees to assign")
    }
  }

  const getStatusColor = (status: ServiceRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-2xl tracking-tight">{request.title}</h1>
          <p className="text-muted-foreground text-sm">Request ID: {request.id}</p>
        </div>
        <Badge className={getStatusColor(request.status)} variant="secondary">
          {request.status}
        </Badge>
      </div>

      <div className="gap-6 grid lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-sm">Description</h3>
                <p className="text-muted-foreground text-sm">{request.description}</p>
              </div>
              <div className="gap-4 grid sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-medium text-sm">Category</h3>
                  <p className="text-sm">{request.category}</p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-sm">Priority</h3>
                  <Badge variant="secondary">{request.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{request.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{request.clientEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{request.propertyAddress}</span>
              </div>
              {request.propertySize && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Property Size: {request.propertySize}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Request history and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No updates yet</p>
                ) : (
                  updates
                    .slice()
                    .reverse()
                    .map((update) => (
                      <div key={update.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="bg-primary rounded-full w-2 h-2" />
                          <div className="bg-border w-px flex-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">{update.message}</p>
                          <p className="text-muted-foreground text-xs">{new Date(update.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium text-sm">Update Status</label>
                <Select value={request.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {request.status === "pending" && availableEmployees.length > 0 && (
                <div className="bg-blue-500/10 border-blue-500/20 p-3 border rounded-lg">
                  <p className="text-blue-700 text-xs dark:text-blue-400">
                    Changing status to "In Progress" will automatically assign this request to an available employee
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium text-sm">Assigned Employee</label>
                <Select
                  value={request.assignedTo || "unassigned"}
                  onValueChange={(value) => value !== "unassigned" && handleAssignEmployee(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!request.assignedTo && availableEmployees.length > 0 && (
                <Button onClick={handleAutoAssign} className="w-full gap-2 bg-transparent" variant="outline">
                  <Zap className="h-4 w-4" />
                  Auto-Assign to Available Employee
                </Button>
              )}
              {!request.assignedTo && availableEmployees.length === 0 && (
                <div className="bg-yellow-500/10 border-yellow-500/20 p-3 border rounded-lg">
                  <p className="text-yellow-700 text-xs dark:text-yellow-400">
                    No available employees. All employees are currently busy.
                  </p>
                </div>
              )}
              {assignedUser && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium text-sm">{assignedUser.name}</p>
                  <p className="text-muted-foreground text-xs">{assignedUser.email}</p>
                  <Badge className="mt-2" variant="secondary">
                    {assignedUser.status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Last Updated</p>
                  <p className="font-medium">{new Date(request.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
