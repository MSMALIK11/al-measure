"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, FileText } from "lucide-react"
import Link from "next/link"
import UserProfileIcon from "../shared/UserProfileIcon"

type AdminView = "requests" | "users" | "request-detail"

interface AdminHeaderProps {
  view: AdminView
  onViewChange: (view: AdminView) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
}

export function AdminHeader({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AdminHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-4xl tracking-tight text-balance">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage requests, users, and assignments</p>
        </div>
        <div>
          <UserProfileIcon />
        <Link href="/">
          <Button variant="outline">Go to Client View</Button>
        </Link>

        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={view === "requests" ? "default" : "outline"}
          onClick={() => onViewChange("requests")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Requests
        </Button>
        <Button
          variant={view === "users" ? "default" : "outline"}
          onClick={() => onViewChange("users")}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Users
        </Button>
      </div>

      {view === "requests" && (
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
