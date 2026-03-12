"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, FileText } from "lucide-react"
import Link from "next/link"
import UserProfileIcon from "../shared/UserProfileIcon"
import { cn } from "@/lib/utils"

type AdminView = "requests" | "users" | "request-detail"

interface AdminHeaderProps {
  view: AdminView
  onViewChange?: (view: AdminView) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
}

export function AdminHeader({
  view,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AdminHeaderProps) {
  const pathname = usePathname()
  const isRequests = pathname === "/admin"
  const isUsers = pathname === "/admin/users"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header">
          <h1 className="page-title">Requests</h1>
          <p className="page-description">
            View and manage submitted takeoff requests
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UserProfileIcon />
          <Link href="/client">
            <Button variant="outline" size="sm">
              Client view
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin">
          <Button
            variant={isRequests ? "default" : "outline"}
            size="sm"
            className={cn("gap-2", isRequests && "shadow-sm")}
          >
            <FileText className="h-4 w-4" />
            Requests
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button
            variant={isUsers ? "default" : "outline"}
            size="sm"
            className={cn("gap-2", isUsers && "shadow-sm")}
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
        </Link>
      </div>

      {view === "requests" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by title, description, address..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="pending-qa">Pending QA</SelectItem>
              <SelectItem value="qa-approved">QA Approved</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
