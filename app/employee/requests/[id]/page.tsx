"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { EmployeeTaskWorkspace } from "@/components/employee/employee-task-workspace"
import { toast } from "sonner"

export default function EmployeeRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await http.get(endpoints.authMe, { withCredentials: true })
      const uid = data?.user?.id ?? null
      setCurrentUserId(uid)
      if (data?.user?.role !== "employee") setAuthFailed(true)
      return uid
    } catch {
      setAuthFailed(true)
      return null
    }
  }, [])

  const fetchRequest = useCallback(async () => {
    if (!id) return
    const uid = await fetchMe()
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await http.get(endpoints.requestById(id), { withCredentials: true })
      const req = data.data as ServiceRequest
      if (req.assignedTo !== uid) {
        toast.error("This task is not assigned to you")
        setRequest(null)
      } else {
        setRequest(req)
      }
    } catch (e) {
      toast.error("Request not found")
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }, [id, fetchMe])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const handleBack = () => router.push("/employee")
  const handleRequestUpdated = (updated: ServiceRequest) => {
    setRequest((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
  }

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground mb-4">Please sign in as an employee.</p>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-32 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
        <p className="text-muted-foreground mb-4">Task not found or not assigned to you.</p>
        <Link href="/employee" className="text-primary hover:underline font-medium">
          ← Back to My Tasks
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0 animate-fadeIn">
      <EmployeeTaskWorkspace
        request={request}
        onBack={handleBack}
        onRequestUpdated={handleRequestUpdated}
      />
    </div>
  )
}
