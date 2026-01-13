"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, ArrowRight } from "lucide-react"
import type { ServiceRequest, User as UserType } from "@/lib/types"

interface AdminRequestListProps {
  requests: ServiceRequest[]
  users: UserType[]
  onSelectRequest: (id: string) => void
}

export function AdminRequestList({ requests, users, onSelectRequest }: AdminRequestListProps) {
  const getStatusColor = (status: ServiceRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
    }
  }

  const getPriorityColor = (priority: ServiceRequest["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      case "medium":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      case "urgent":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
    }
  }
console.log('requests',requests)
  const getAssignedUser = (userId?: string) => {
    if (!userId) return null
    return users.find((u) => u.id === userId)
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No requests found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-xl">All Requests ({requests.length})</h2>
      <div className="gap-4 grid">
        {requests.map((request) => {
          const assignedUser = getAssignedUser(request.assignedTo)
          return (
            <Card key={request.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Badge className={getStatusColor(request.status)} variant="secondary">
                        {request.status}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)} variant="secondary">
                        {request.priority}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{request.description}</CardDescription>
                  </div>
                  <Button onClick={() => onSelectRequest(request.id)} size="sm" className="gap-2">
                    View
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{request.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">{request.propertyAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assigned:</span>
                    <span className="font-medium">{assignedUser ? assignedUser.name : "Unassigned"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

      </div>
      
    </div>
  )
}
