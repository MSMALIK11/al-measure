"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { AdminStats } from "@/components/admin/admin-stats"
import { AdminRequestList } from "@/components/admin/admin-request-list"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-fadeIn">
      <AdminHeader
        view="requests"
        onViewChange={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <AdminStats requests={requests} users={[]} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">
            All requests
            <span className="text-muted-foreground font-normal ml-1.5">
              ({filteredRequests.length})
            </span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchRequests()}
            className="text-primary hover:text-primary"
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-card animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        ) : (
          <AdminRequestList
            requests={filteredRequests}
            users={[]}
            onSelectRequest={(id) => {}}
          />
        )}
      </section>
    </div>
  )
}
