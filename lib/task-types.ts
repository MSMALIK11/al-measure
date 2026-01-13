export type TaskStatus = "pending" | "under_review" | "completed" | "cancelled"
export type RequestCategory =
  | "landscape-measurement"
  | "property-assessment"
  | "maintenance-request"
  | "consultation"
  | "other"

export type UserRole = "admin" | "employee" | "client"
export type UserStatus = "available" | "busy" | "offline"
export type RequestPriority = "low" | "medium" | "high" | "urgent"
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  assignedRequestIds: string[]
  createdAt: string
}
export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  geometry: any
  createdAt: string
  updatedAt: string
  clientId: string 
  propertySize?: number | string // in sqft
   notes?: string
  assignedTo?: string 
    attachments?: string[]
  estimatedCompletion?: string
  propertyFeatures: string[]
}

export const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  completed: "Completed",
  cancelled: "Cancelled",
}
