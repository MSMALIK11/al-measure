export type RequestStatus =
  | "pending"
  | "pending-qa"
  | "qa-approved"
  | "in-progress"
  | "completed"
  | "cancelled"

export type RequestPriority = "low" | "medium" | "high" | "urgent"

/** Industry / takeoff type (Attentive-style) */
export type TakeoffIndustry =
  | "landscaping"
  | "paving"
  | "snow-removal"
  | "irrigation"
  | "hardscape"
  | "facilities"

export type RequestCategory =
  | "landscape-measurement"
  | "property-assessment"
  | "maintenance-request"
  | "consultation"
  | "paving"
  | "snow-removal"
  | "irrigation"
  | "hardscape"
  | "other"

export type UserRole = "admin" | "employee" | "client" | "qa"

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

/** Single measurement item (e.g. lawn area, curb length) */
export interface TakeoffItem {
  id: string
  label: string // e.g. "Lawn", "Mulch Bed", "Pavement"
  type: "polygon" | "line" | "point"
  area?: number // sq ft
  length?: number // ft
  unit: string
  geometry?: any // GeoJSON
  color?: string
}

export interface ServiceRequest {
  id?: string
  title: string
  description: string
  category: RequestCategory
  /** Industry for takeoff (landscaping, paving, snow, etc.) */
  takeoffIndustry?: TakeoffIndustry
  priority: RequestPriority
  status: RequestStatus
  geometry: any
  /** Multiple measured areas/lengths per request (Attentive-style) */
  takeoffItems?: TakeoffItem[]
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
  /** Shareable view-only link token */
  shareToken?: string | null
  /** QA feedback text when sent back to employee */
  qaFeedback?: string
  /** QA comments on the file/map (e.g. for rework) */
  qaComments?: Array<{ id: string; text: string; position?: [number, number]; createdAt: string }>
}

export interface RequestUpdate {
  id: string
  requestId: string
  status: RequestStatus
  message: string
  timestamp: string
}
