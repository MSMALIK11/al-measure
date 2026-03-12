"use client"

import { useCallback, useEffect, useState } from "react"
import type { ServiceRequest } from "@/lib/types"
import { RequestList } from "@/components/request-list"
import { RequestDetail } from "@/components/request-detail"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import { toast } from "sonner"

type View = "dashboard" | "request-detail"

export default function ClientDashboard() {
  const [view, setView] = useState<View>("dashboard")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [requestUpdates, setRequestUpdates] = useState<Record<string, { id: string; requestId: string; status: string; message: string; timestamp: string }[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await http.get(endpoints.requests, { withCredentials: true })
      setRequests(data.data || [])
    } catch (e) {
      toast.error("Failed to load requests")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequestId(requestId)
    setView("request-detail")
  }

  const handleBackToDashboard = () => {
    setView("dashboard")
    setSelectedRequestId(null)
  }

  const statusMessages: Record<string, string> = {
    pending: "Request status changed to pending",
    "pending-qa": "Submitted for QA review",
    "qa-approved": "QA approved",
    "in-progress": "Request is now being processed",
    completed: "Request has been completed successfully",
    cancelled: "Request has been cancelled",
  }

  const handleUpdateStatus = async (status: ServiceRequest["status"]) => {
    if (!selectedRequestId) return
    try {
      await http.put(endpoints.requestById(selectedRequestId), { status }, { withCredentials: true })
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequestId ? { ...r, status, updatedAt: new Date().toISOString() } : r))
      )
      setRequestUpdates((prev) => ({
        ...prev,
        [selectedRequestId]: [
          ...(prev[selectedRequestId] || []),
          {
            id: `update-${Date.now()}`,
            requestId: selectedRequestId,
            status,
            message: statusMessages[status] || `Status changed to ${status}`,
            timestamp: new Date().toISOString(),
          },
        ],
      }))
      toast.success("Status updated")
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update status")
    }
  }

  const handleRequestUpdated = (updated: ServiceRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
  }

  const handleRefresh = () => {
    fetchRequests()
  }

  const selectedRequest = selectedRequestId ? requests.find((r) => r.id === selectedRequestId) : null
  const updates = selectedRequestId ? requestUpdates[selectedRequestId] || [] : []

  // Calculate statistics (include QA statuses)
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending" || r.status === "pending-qa" || r.status === "qa-approved").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  }

  const statCards = [
    {
      label: "Total Requests",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-950",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: AlertCircle,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
    },
  ]

  // Calculate completion rate
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 w-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {view === "dashboard" && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="gap-2 h-10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card
                    key={stat.label}
                    className={cn(
                      "border-2 transition-all hover:shadow-lg",
                      stat.borderColor
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {stat.label}
                          </p>
                          <p className="text-4xl font-bold text-gray-900 dark:text-white">
                            {stat.value}
                          </p>
                        </div>
                        <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                          <Icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Completion Rate Card */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Completion Rate
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.completed} of {stats.total} requests completed
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {completionRate}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requests Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Requests
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage and track all your service requests
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading requests…</p>
              ) : (
                <RequestList
                  requests={requests}
                  onSelectRequest={handleSelectRequest}
                />
              )}
            </div>
          </>
        )}

        {view === "request-detail" && selectedRequest && (
          <RequestDetail
            request={selectedRequest}
            updates={updates}
            onBack={handleBackToDashboard}
            onUpdateStatus={handleUpdateStatus}
            onRequestUpdated={handleRequestUpdated}
          />
        )}
      </div>
    </div>
  )
}
