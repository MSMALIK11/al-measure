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
import { ClipboardList, Loader2, ArrowRight, LogIn } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "pending-qa": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "qa-approved": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

export default function EmployeeDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [authFailed, setAuthFailed] = useState(false)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await http.get(endpoints.authMe, { withCredentials: true })
      const id = data?.user?.id ?? null
      setCurrentUserId(id)
      if (data?.user?.role !== "employee") {
        setAuthFailed(true)
        return null
      }
      return id
    } catch {
      setAuthFailed(true)
      setCurrentUserId(null)
      return null
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    const userId = await fetchMe()
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await http.get(`${endpoints.requests}?assignedTo=${userId}`, {
        withCredentials: true,
      })
      setRequests(data.data ?? [])
    } catch (e) {
      toast.error("Failed to load your tasks")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [fetchMe])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
        <p className="text-muted-foreground mb-4">Please sign in as an employee to view your tasks.</p>
        <Link href="/login">
          <Button className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-description">
          Requests assigned to you. Open a task to add measurements and submit to QA.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">
            Assigned requests
            <span className="text-muted-foreground font-normal ml-1.5">({requests.length})</span>
          </h2>
          <Button variant="outline" size="sm" onClick={() => fetchRequests()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="overflow-hidden border border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="rounded-full bg-muted p-4 mb-4">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No tasks assigned yet</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                When an admin assigns requests to you, they will appear here.
              </p>
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
                    <TableHead className="font-semibold hidden sm:table-cell">Description</TableHead>
                    <TableHead className="font-semibold">Request ID</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Updated</TableHead>
                    <TableHead className="w-[80px] font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const href = `/employee/requests/${request.id}`
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium max-w-[200px]">
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
                        <TableCell className="max-w-[220px] hidden sm:table-cell text-muted-foreground">
                          <span className="line-clamp-2">{request.description || "—"}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {request.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap hidden md:table-cell">
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
