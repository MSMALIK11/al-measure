"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"

interface DashboardHeaderProps {
  onNewRequest: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  requestCount: number
}

export function DashboardHeader({
  onNewRequest,
  requestCount,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Title and Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
        </div>
       
      </div>
      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {requestCount} {requestCount === 1 ? "request" : "requests"}
      </div>
    </div>
  )
}
