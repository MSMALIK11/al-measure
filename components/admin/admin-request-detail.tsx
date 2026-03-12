"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Mail,
  Package,
  Loader2,
  Map,
  UserPlus,
  Zap,
} from "lucide-react"
import type { ServiceRequest } from "@/lib/types"
import { RequestMapView } from "./request-map-view"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EmployeeOption {
  id: string
  name: string
  email: string
  role: string
}

interface AdminRequestDetailProps {
  request: ServiceRequest
  onBack: () => void
  onRequestUpdated?: (request: ServiceRequest) => void
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "pending-qa": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "qa-approved": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const STATUS_OPTIONS: ServiceRequest["status"][] = [
  "pending",
  "pending-qa",
  "qa-approved",
  "in-progress",
  "completed",
  "cancelled",
]

export function AdminRequestDetail({
  request,
  onBack,
  onRequestUpdated,
}: AdminRequestDetailProps) {
  const [updating, setUpdating] = useState(false)
  const [localRequest, setLocalRequest] = useState(request)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [inProgressCountByEmployee, setInProgressCountByEmployee] = useState<Record<string, number>>({})
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(request.assignedTo ?? "")
  const [assigning, setAssigning] = useState(false)

  const req = localRequest

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true)
    try {
      const [usersRes, requestsRes] = await Promise.all([
        http.get(`${endpoints.users}?role=employee`, { withCredentials: true }),
        http.get(`${endpoints.requests}?status=in-progress&limit=500`, { withCredentials: true }),
      ])
      const list = usersRes.data?.data ?? []
      setEmployees(list)
      const inProgress = (requestsRes.data?.data ?? []) as ServiceRequest[]
      const countByEmployee: Record<string, number> = {}
      list.forEach((e: EmployeeOption) => { countByEmployee[e.id] = 0 })
      inProgress.forEach((r) => {
        if (r.assignedTo) countByEmployee[r.assignedTo] = (countByEmployee[r.assignedTo] ?? 0) + 1
      })
      setInProgressCountByEmployee(countByEmployee)
    } catch {
      setEmployees([])
      setInProgressCountByEmployee({})
    } finally {
      setEmployeesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    setSelectedEmployeeId(req.assignedTo ?? "")
  }, [req.assignedTo])

  const handleAssign = async (employeeId: string | null) => {
    if (!req?.id) return
    setAssigning(true)
    try {
      const { data } = await http.put(
        endpoints.requestById(req.id),
        { assignedTo: employeeId || undefined, status: employeeId ? "in-progress" : req.status },
        { withCredentials: true }
      )
      setLocalRequest(data.data)
      onRequestUpdated?.(data.data)
      toast.success(employeeId ? "Assigned to employee" : "Assignment cleared")
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to assign")
    } finally {
      setAssigning(false)
    }
  }

  const handleAutoAssign = async () => {
    if (!req?.id || employees.length === 0) {
      toast.error("No employees available to assign")
      return
    }
    try {
      const { data: requestsData } = await http.get(
        `${endpoints.requests}?status=in-progress&limit=200`,
        { withCredentials: true }
      )
      const inProgress = (requestsData.data ?? []) as ServiceRequest[]
      const assignedCount: Record<string, number> = {}
      employees.forEach((e) => { assignedCount[e.id] = 0 })
      inProgress.forEach((r) => {
        if (r.assignedTo) assignedCount[r.assignedTo] = (assignedCount[r.assignedTo] ?? 0) + 1
      })
      const sorted = [...employees].sort(
        (a, b) => (assignedCount[a.id] ?? 0) - (assignedCount[b.id] ?? 0)
      )
      const pick = sorted[0]
      if (pick) {
        setAssigning(true)
        const { data } = await http.put(
          endpoints.requestById(req.id),
          { assignedTo: pick.id, status: "in-progress" },
          { withCredentials: true }
        )
        setLocalRequest(data.data)
        onRequestUpdated?.(data.data)
        setSelectedEmployeeId(pick.id)
        toast.success(`Auto-assigned to ${pick.name}`)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Auto-assign failed")
    } finally {
      setAssigning(false)
    }
  }

  const handleStatusChange = async (status: ServiceRequest["status"]) => {
    if (!req?.id) return
    setUpdating(true)
    try {
      const { data } = await http.put(
        endpoints.requestById(req.id),
        { status },
        { withCredentials: true }
      )
      setLocalRequest(data.data)
      onRequestUpdated?.(data.data)
      toast.success("Status updated")
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl lg:text-2xl tracking-tight truncate">
            {req.title}
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-0.5">
            {req.id}
          </p>
        </div>
        <Badge
          className={cn("font-medium", statusColors[req.status])}
          variant="secondary"
        >
          {req.status.replace(/-/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm leading-relaxed">{req.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">
                    Category
                  </h3>
                  <p className="text-sm capitalize">
                    {req.category?.replace(/-/g, " ")}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">
                    Priority
                  </h3>
                  <Badge variant="secondary">{req.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" />
                Request on map
              </CardTitle>
              <CardDescription>
                Drawn area or measurement from the client
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RequestMapView
                geometry={req.geometry}
                className="w-full h-[280px]"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{req.clientName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{req.clientEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{req.propertyAddress || "—"}</span>
              </div>
              {req.propertySize && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Property size: {req.propertySize}</span>
                </div>
              )}
              {Array.isArray(req.propertyFeatures) && req.propertyFeatures.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Property features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.propertyFeatures.map((f: string) => (
                      <Badge
                        key={f}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {f.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(req.takeoffItems?.length ?? 0) > 0 && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Takeoff Summary</CardTitle>
                <CardDescription>Measurements from request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Label</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-right p-2 font-medium">Area (sq ft)</th>
                        <th className="text-right p-2 font-medium">Length (ft)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.takeoffItems!.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.label}</td>
                          <td className="p-2">{item.type}</td>
                          <td className="p-2 text-right">{item.area ?? "—"}</td>
                          <td className="p-2 text-right">{item.length ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Assignment
              </CardTitle>
              <CardDescription>
                Assign to an employee or auto-assign to an available one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned to</label>
                <Select
                  value={selectedEmployeeId || "none"}
                  onValueChange={(v) => setSelectedEmployeeId(v === "none" ? "" : v)}
                  disabled={assigning || employeesLoading}
                >
                  <SelectTrigger className="w-full">
                    {employeesLoading ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading employees…
                      </span>
                    ) : (
                      <SelectValue placeholder="Select employee" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {[...employees]
                      .sort((a, b) => (inProgressCountByEmployee[a.id] ?? 0) - (inProgressCountByEmployee[b.id] ?? 0))
                      .map((emp) => {
                        const count = inProgressCountByEmployee[emp.id] ?? 0
                        const availability = count === 0 ? "— Available" : `— ${count} in progress`
                        return (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.email}) {availability}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
                {!employeesLoading && employees.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No employees found. Add users with role &quot;Employee&quot; in Admin → Users.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  disabled={assigning || !selectedEmployeeId}
                  onClick={() => handleAssign(selectedEmployeeId || null)}
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={assigning || employees.length === 0 || employeesLoading}
                  onClick={handleAutoAssign}
                >
                  <Zap className="h-4 w-4" />
                  Auto-assign
                </Button>
              </div>
              {req.assignedTo && (
                <p className="text-xs text-muted-foreground">
                  Currently assigned to: {employees.find((e) => e.id === req.assignedTo)?.name ?? req.assignedTo}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>Update request status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={req.status}
                  onValueChange={(v) => handleStatusChange(v as ServiceRequest["status"])}
                  disabled={updating}
                >
                  <SelectTrigger className="w-full">
                    {updating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating…
                      </span>
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Last updated</p>
                  <p className="font-medium">
                    {new Date(req.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
