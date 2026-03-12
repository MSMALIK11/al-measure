"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Activity, RefreshCw, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "pending-qa": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "qa-approved": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const REFRESH_INTERVAL_MS = 15000

export default function AdminProcessPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"in-progress" | "pending-qa" | "all">("in-progress")

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await http.get(endpoints.users, { withCredentials: true })
      setUsers(data.data ?? [])
    } catch {
      setUsers([])
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const url =
        statusFilter === "all"
          ? `${endpoints.requests}?limit=100`
          : `${endpoints.requests}?status=${statusFilter}&limit=100`
      const { data } = await http.get(url, { withCredentials: true })
      const list = (data.data ?? []) as ServiceRequest[]
      const filtered =
        statusFilter === "all"
          ? list.filter(
              (r) => r.status === "in-progress" || r.status === "pending-qa" || r.status === "qa-approved"
            )
          : list
      setRequests(filtered)
    } catch (e) {
      toast.error("Failed to load process view")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchRequests()
    const t = setInterval(fetchRequests, REFRESH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [fetchRequests])

  const getEmployeeName = (userId?: string) => {
    if (!userId) return "—"
    return users.find((u) => u.id === userId)?.name ?? userId
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary shrink-0" />
            Process
          </h1>
          <p className="page-description">
            See which requests are in progress and which employee is working on each. Updates every 15s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted/30 p-1">
            {(["in-progress", "pending-qa", "all"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "secondary" : "ghost"}
                size="sm"
                className="rounded-md"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All active" : s.replace(/-/g, " ")}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchRequests()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="section-title">
          Active work
          <span className="text-muted-foreground font-normal ml-1.5">({requests.length})</span>
        </h2>

        {loading && requests.length === 0 ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="overflow-hidden border border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">No active requests for this filter.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Assigned to</TableHead>
                    <TableHead className="font-semibold">Request ID</TableHead>
                    <TableHead className="font-semibold">Updated</TableHead>
                    <TableHead className="w-[80px] font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const assignedName = getEmployeeName(request.assignedTo)
                    const href = `/admin/requests/${request.id}`
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium max-w-[220px]">
                          <Link
                            href={href}
                            className="text-foreground hover:text-primary hover:underline line-clamp-2"
                          >
                            {request.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn("font-medium text-xs", statusColors[request.status])}
                            variant="secondary"
                          >
                            {request.status.replace(/-/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{assignedName}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {request.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {request.updatedAt
                            ? new Date(request.updatedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-primary hover:bg-primary/10"
                            asChild
                          >
                            <Link href={href}>
                              View
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
