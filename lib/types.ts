export type RequestStatus = "pending" | "in-progress" | "completed" | "cancelled"

export type RequestPriority = "low" | "medium" | "high" | "urgent"

export type RequestCategory =
  | "landscape-measurement"
  | "property-assessment"
  | "maintenance-request"
  | "consultation"
  | "other"

export type UserRole = "admin" | "employee" | "client"

export type UserStatus = "available" | "busy" | "offline"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  assignedRequestIds: string[]
  createdAt: string
}

export interface ServiceRequest {
  id?: string
  title: string
  description: string
  category: RequestCategory
  priority: RequestPriority
  status: RequestStatus
  geometry: any
  clientName: string
  clientEmail: string
  propertyAddress: string
  propertySize?: number | string // in sqft
  propertyFeatures: string[]
  assignedTo?: string // User ID
  createdAt: string
  updatedAt: string
  notes?: string
  attachments?: string[]
  estimatedCompletion?: string
}

export interface RequestUpdate {
  id: string
  requestId: string
  status: RequestStatus
  message: string
  timestamp: string
}
