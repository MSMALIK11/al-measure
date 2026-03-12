"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { AdminRequestDetail } from "@/components/admin/admin-request-detail"
import { toast } from "sonner"

export default function AdminRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRequest = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await http.get(endpoints.requestById(id), { withCredentials: true })
      setRequest(data.data)
    } catch (e) {
      toast.error("Request not found")
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const handleBack = () => {
    router.push("/admin")
  }

  const handleRequestUpdated = (updated: ServiceRequest) => {
    setRequest((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
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
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
        <p className="text-muted-foreground mb-4">Request not found.</p>
        <Link
          href="/admin"
          className="text-primary hover:underline font-medium"
        >
          ← Back to Requests
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <AdminRequestDetail
        request={request}
        onBack={handleBack}
        onRequestUpdated={handleRequestUpdated}
      />
    </div>
  )
}
