"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { AdminRequestList } from "@/components/admin/admin-request-list"
import { AdminRequestDetail } from "@/components/admin/admin-request-detail"
import { UserManagement } from "@/components/admin/user-management"

type AdminView = "requests" | "users" | "request-detail"

export default function AdminPage() {
  const [view, setView] = useState<AdminView>("requests")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { requests, users, initializeMockData } = useStore()

  useEffect(() => {
    initializeMockData()
  }, [initializeMockData])

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequestId(requestId)
    setView("request-detail")
  }

  const handleBackToRequests = () => {
    setView("requests")
    setSelectedRequestId(null)
  }

  const selectedRequest = selectedRequestId ? requests.find((r) => r.id === selectedRequestId) : null

  return (
    <div className="min-h-screen bg-background">
      <div className=" px-4 ">
        <AdminHeader
          view={view}
          onViewChange={setView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {view === "requests" && (
          <div className="space-y-8 mt-8">
            <AdminStats requests={requests} users={users} />
            <AdminRequestList requests={filteredRequests} users={users} onSelectRequest={handleSelectRequest} />
          </div>
        )}

        {view === "users" && (
          <div className="mt-8">
            <UserManagement />
          </div>
        )}

        {view === "request-detail" && selectedRequest && (
          <div className="mt-8">
            <AdminRequestDetail request={selectedRequest} onBack={handleBackToRequests} />
          </div>
        )}
      </div>
    </div>
  )
}
