import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Task, TaskStatus } from "./task-types"

type State = {
  tasks: Task[]
  clientId: string
  addTask: (partial: Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "clientId">) => Task
  setStatus: (id: string, status: TaskStatus) => void
  removeTask: (id: string) => void
}

function getOrCreateClientId() {
  if (typeof window === "undefined") return "server"
  const key = "client-id"
  let id = window.localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
  }
  return id
}

export const useTasksStore = create<State>()(
  persist(
    (set, get) => ({
      tasks: [],
      clientId: typeof window !== "undefined" ? getOrCreateClientId() : "server",
      addTask: (partial) => {
        const now = new Date().toISOString()
        const task: Task = {
          id: crypto.randomUUID(),
          title: partial.title,
          description: partial.description,
          geometry: partial.geometry,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          clientId: get().clientId,
        }
        set((s) => ({ tasks: [task, ...s.tasks] }))
        return task
      },
      setStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
    }),
    { name: "tasks-db" },
  ),
)
