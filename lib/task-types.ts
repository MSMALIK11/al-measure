export type TaskStatus = "pending" | "under_review" | "completed"

export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  geometry: any // GeoJSON Feature
  createdAt: string
  updatedAt: string
  clientId: string // local identifier (no auth)
}

export const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  completed: "Completed",
}
