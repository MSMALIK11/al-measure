"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, FileText, Calendar, Ruler } from "lucide-react"
import type { ServiceRequest } from "@/lib/types"
import { endpoints } from "@/services/modules/endpoints"
import http from "@/services/http"

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError("Invalid link")
      return
    }
    http
      .get(endpoints.shareByToken(token))
      .then((res) => {
        setRequest(res.data.data)
        setError(null)
      })
      .catch(() => {
        setError("Not found or link expired")
        setRequest(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Request not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryLabels: Record<string, string> = {
    "landscape-measurement": "Landscape Measurement",
    "property-assessment": "Property Assessment",
    "maintenance-request": "Maintenance Request",
    consultation: "Consultation",
    paving: "Paving",
    "snow-removal": "Snow Removal",
    irrigation: "Irrigation",
    hardscape: "Hardscape",
    other: "Other",
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pb-4 border-b">
          <p className="text-sm text-muted-foreground">View-only share link · Al-Measure Takeoff</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{categoryLabels[request.category] || request.category}</Badge>
              <Badge variant="secondary">{request.status}</Badge>
              {request.takeoffIndustry && (
                <Badge variant="outline">{request.takeoffIndustry}</Badge>
              )}
            </div>
            <CardTitle className="text-xl mt-2">{request.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{request.description}</p>

            <Separator />

            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{request.propertyAddress || "—"}</span>
              </div>
              {request.propertySize && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>{request.propertySize} sq ft</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {(request.takeoffItems?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    Takeoff Summary
                  </h3>
                  <table className="w-full text-sm border rounded-md overflow-hidden">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2">Label</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">Area (sq ft)</th>
                        <th className="text-right p-2">Length (ft)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.takeoffItems!.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.label}</td>
                          <td className="p-2">{item.type}</td>
                          <td className="p-2 text-right">{item.area ?? ""}</td>
                          <td className="p-2 text-right">{item.length ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This is a read-only view. No AI was used for measurements.
        </p>
      </div>
    </div>
  )
}
