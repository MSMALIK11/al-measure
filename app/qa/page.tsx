"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"

export default function QADashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await http.get(endpoints.authMe, { withCredentials: true })
      if (data?.user?.role !== "qa") setAuthFailed(true)
      return data?.user?.id
    } catch {
      setAuthFailed(true)
      return null
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    const uid = await fetchMe()
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await http.get(`${endpoints.requests}?status=pending-qa&limit=100`, {
        withCredentials: true,
      })
      setRequests(data.data ?? [])
    } catch (e) {
      toast.error("Failed to load review queue")
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
        <p className="text-muted-foreground mb-4">Sign in as QA to access the review queue.</p>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          Review queue
        </h1>
        <p className="text-muted-foreground mt-1">
          Requests submitted for QA. Approve or send back to employee.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-0 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">No requests pending QA review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Link key={req.id} href={`/qa/requests/${req.id}`} className="block">
              <Card className="overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{req.title}</CardTitle>
                      <CardDescription className="text-sm font-mono mt-0.5">{req.id}</CardDescription>
                      {req.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{req.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-primary font-medium shrink-0">Review →</span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
