"use client"

import { useState, useMemo } from "react"
import type { ServiceRequest } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Calendar, 
  Ruler,
  Filter,
  FileText,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { Button } from "./ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RequestListProps {
  requests: ServiceRequest[]
  onSelectRequest: (requestId: string) => void
}

const statusConfig = {
  pending: { 
    label: "Pending", 
    color: "bg-yellow-500 dark:bg-yellow-600",
    textColor: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    dotColor: "bg-yellow-500"
  },
  "in-progress": { 
    label: "In Progress", 
    color: "bg-blue-500 dark:bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500"
  },
  completed: { 
    label: "Completed", 
    color: "bg-green-500 dark:bg-green-600",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    dotColor: "bg-green-500"
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-gray-500 dark:bg-gray-600",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-900",
    borderColor: "border-gray-200 dark:border-gray-700",
    dotColor: "bg-gray-500"
  },
}

const priorityConfig = {
  low: { 
    label: "Low", 
    color: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" 
  },
  medium: { 
    label: "Medium", 
    color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" 
  },
  high: { 
    label: "High", 
    color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700" 
  },
  urgent: { 
    label: "Urgent", 
    color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700" 
  },
}

const categoryLabels = {
  "landscape-measurement": "Landscape Measurement",
  "property-assessment": "Property Assessment",
  "maintenance-request": "Maintenance Request",
  consultation: "Consultation",
  other: "Other",
}

export function RequestList({ requests, onSelectRequest }: RequestListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesPriority = priorityFilter === "all" || r.priority === priorityFilter
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [requests, statusFilter, priorityFilter, searchTerm])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              {(statusFilter !== "all" || priorityFilter !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all")
                    setPriorityFilter("all")
                    setSearchTerm("")
                  }}
                  className="h-8 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 px-1">
        <span className="font-medium">
          {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
        </span>
      </div>

      {/* Table */}
      <Card className="border-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900">
                <TableHead className="font-semibold text-gray-900 dark:text-white">Request</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Priority</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Location</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Size</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Date</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                        No requests found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Submit a new request to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const statusInfo = statusConfig[request.status]
                  const priorityInfo = priorityConfig[request.priority]
                  
                  return (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                      onClick={() => onSelectRequest(request.id!)}
                    >
                      {/* Request Title */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1 max-w-xs">
                          <span className="text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {request.title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {request.description}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", statusInfo.dotColor)} />
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium border-2",
                              statusInfo.textColor,
                              statusInfo.bgColor,
                              statusInfo.borderColor
                            )}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn("font-medium border", priorityInfo.color)}
                        >
                          {priorityInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {categoryLabels[request.category]}
                        </span>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {request.propertyAddress}
                          </span>
                        </div>
                      </TableCell>

                      {/* Size */}
                      <TableCell>
                        {request.propertySize ? (
                          <div className="flex items-center gap-1.5">
                            <Ruler className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {request.propertySize} ft²
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
