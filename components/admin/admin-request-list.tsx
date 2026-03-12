"use client"

import Link from "next/link"
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
import { ArrowRight } from "lucide-react"
import type { ServiceRequest, User as UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AdminRequestListProps {
  requests: ServiceRequest[]
  users: UserType[]
  onSelectRequest?: (id: string) => void
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "pending-qa": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "qa-approved": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function AdminRequestList({ requests, users, onSelectRequest }: AdminRequestListProps) {
  const getStatusColor = (status: ServiceRequest["status"]) =>
    statusColors[status] || statusColors.pending

  const getPriorityColor = (priority: ServiceRequest["priority"]) =>
    priorityColors[priority] || priorityColors.medium

  const getAssignedUser = (userId?: string) => {
    if (!userId) return null
    return users.find((u) => u.id === userId)
  }

  if (requests.length === 0) {
    return (
      <Card className="overflow-hidden border border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">No requests match your filters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border border-border">
      <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Assigned</TableHead>
            <TableHead className="font-semibold">Address</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="w-[80px] font-semibold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const assignedUser = getAssignedUser(request.assignedTo)
            const href = `/admin/requests/${request.id}`

            return (
              <TableRow key={request.id} className="group">
                <TableCell className="font-medium max-w-[200px]">
                  <Link
                    href={href}
                    className="text-foreground hover:text-primary hover:underline line-clamp-2"
                  >
                    {request.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{request.clientName}</TableCell>
                <TableCell>
                  <Badge
                    className={cn("font-medium text-xs", getStatusColor(request.status))}
                    variant="secondary"
                  >
                    {request.status.replace(/-/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("font-medium text-xs", getPriorityColor(request.priority))}
                    variant="secondary"
                  >
                    {request.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {assignedUser ? assignedUser.name : "—"}
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-muted-foreground">
                  {request.propertyAddress || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(request.createdAt).toLocaleDateString()}
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
  )
}
