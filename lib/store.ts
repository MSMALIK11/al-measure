import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ServiceRequest, RequestUpdate, User, UserStatus } from "@/lib/types"

interface AppState {
  // Requests
  requests: ServiceRequest[]
  requestUpdates: Record<string, RequestUpdate[]>

  // Users
  users: User[]
  currentUser: User | null

  // Actions - Requests
  addRequest: (request: ServiceRequest) => void
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => void
  deleteRequest: (id: string) => void
  getRequestById: (id: string) => ServiceRequest | undefined
  addRequestUpdate: (requestId: string, update: RequestUpdate) => void

  // Actions - Users
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  getUserById: (id: string) => User | undefined
  getAvailableEmployees: () => User[]
  setCurrentUser: (user: User | null) => void

  // Actions - Assignment
  assignRequestToEmployee: (requestId: string, employeeId: string) => void
  autoAssignRequest: (requestId: string) => boolean

  // Initialization
  initializeMockData: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      requests: [],
      requestUpdates: {},
      users: [],
      currentUser: null,

      // Request Actions
      addRequest: (request) =>
        set((state) => ({
          requests: [...state.requests, request],
        })),

      updateRequest: (id, updates) =>
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req,
          ),
        })),

      deleteRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((req) => req.id !== id),
        })),

      getRequestById: (id) => {
        return get().requests.find((req) => req.id === id)
      },

      addRequestUpdate: (requestId, update) =>
        set((state) => ({
          requestUpdates: {
            ...state.requestUpdates,
            [requestId]: [...(state.requestUpdates[requestId] || []), update],
          },
        })),

      // User Actions
      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),

      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        })),

      getUserById: (id) => {
        return get().users.find((user) => user.id === id)
      },

      getAvailableEmployees: () => {
        return get().users.filter(
          (user) => user.role === "employee" && user.status === "available" && user.assignedRequestIds.length === 0,
        )
      },

      setCurrentUser: (user) =>
        set(() => ({
          currentUser: user,
        })),

      // Assignment Actions
      assignRequestToEmployee: (requestId, employeeId) =>
        set((state) => {
          const employee = state.users.find((u) => u.id === employeeId)
          if (!employee) return state

          return {
            requests: state.requests.map((req) =>
              req.id === requestId ? { ...req, assignedTo: employeeId, updatedAt: new Date().toISOString() } : req,
            ),
            users: state.users.map((user) =>
              user.id === employeeId
                ? {
                  ...user,
                  assignedRequestIds: [...user.assignedRequestIds, requestId],
                  status: "busy" as UserStatus,
                }
                : user,
            ),
          }
        }),

      autoAssignRequest: (requestId) => {
        const availableEmployees = get().getAvailableEmployees()
        if (availableEmployees.length === 0) return false

        // Assign to first available employee
        const employee = availableEmployees[0]
        get().assignRequestToEmployee(requestId, employee.id)

        // Add update log
        get().addRequestUpdate(requestId, {
          id: `update-${Date.now()}`,
          requestId,
          status: "in-progress",
          message: `Automatically assigned to ${employee.name}`,
          timestamp: new Date().toISOString(),
        })

        return true
      },

      // Initialize with mock data
      initializeMockData: () => {
        const state = get()
        if (state.requests.length > 0 || state.users.length > 0) return

        // Create mock users
        const mockUsers: User[] = [
          {
            id: "admin-1",
            name: "Admin User",
            email: "admin@example.com",
            role: "admin",
            status: "available",
            assignedRequestIds: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: "emp-1",
            name: "John Smith",
            email: "john@example.com",
            role: "employee",
            status: "available",
            assignedRequestIds: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: "emp-2",
            name: "Sarah Johnson",
            email: "sarah@example.com",
            role: "employee",
            status: "available",
            assignedRequestIds: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: "emp-3",
            name: "Mike Davis",
            email: "mike@example.com",
            role: "employee",
            status: "available",
            assignedRequestIds: [],
            createdAt: new Date().toISOString(),
          },
        ]

        // Create mock requests
        const mockRequests: ServiceRequest[] = [
          {
            id: "req-1",
            title: "Commercial Property Landscape Assessment",
            description: "Need detailed measurements for parking lot landscaping project",
            category: "landscape-measurement",
            priority: "high",
            status: "pending",
            clientName: "ABC Corporation",
            clientEmail: "contact@abc-corp.com",
            propertyAddress: "123 Business Park Dr, London",
            propertySize: "15,000 sqft",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "req-2",
            title: "Residential Garden Maintenance",
            description: "Regular maintenance service for residential property",
            category: "maintenance-request",
            priority: "medium",
            status: "in-progress",
            clientName: "Jane Doe",
            clientEmail: "jane@example.com",
            propertyAddress: "456 Oak Street, Manchester",
            assignedTo: "emp-1",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "req-3",
            title: "Property Assessment for New Development",
            description: "Initial assessment for upcoming residential development",
            category: "property-assessment",
            priority: "urgent",
            status: "pending",
            clientName: "XYZ Developers",
            clientEmail: "info@xyz-dev.com",
            propertyAddress: "789 Development Lane, Birmingham",
            propertySize: "50,000 sqft",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]

        // Update employee with assigned request
        mockUsers[1].assignedRequestIds = ["req-2"]
        mockUsers[1].status = "busy"

        set({
          users: mockUsers,
          requests: mockRequests,
          currentUser: mockUsers[0], // Set admin as default
        })
      },
    }),
    {
      name: "client-dashboard-storage",
    },
  ),
)
