"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import type { ServiceRequest } from "@/lib/types"
import { RequestMapView } from "@/components/admin/request-map-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Send, MessageSquare, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function QARequestReviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [newComment, setNewComment] = useState("")
  const [authFailed, setAuthFailed] = useState(false)
  const [addCommentMode, setAddCommentMode] = useState(false)
  const [pendingComment, setPendingComment] = useState<{ lngLat: [number, number]; pixel: [number, number] } | null>(null)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await http.get(endpoints.authMe, { withCredentials: true })
      if (data?.user?.role !== "qa") setAuthFailed(true)
      return data?.user?.id
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
      setRequest(data.data as ServiceRequest)
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

  const handleApprove = async () => {
    if (!request?.id) return
    setSending(true)
    try {
      await http.put(
        endpoints.requestById(request.id),
        { status: "qa-approved" },
        { withCredentials: true }
      )
      toast.success("Request approved")
      router.push("/qa")
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to approve")
    } finally {
      setSending(false)
    }
  }

  const handleSendFeedback = async () => {
    if (!request?.id) return
    const comments = request.qaComments ?? []
    const nextComments = newComment.trim()
      ? [...comments, { id: `c-${Date.now()}`, text: newComment.trim(), createdAt: new Date().toISOString() }]
      : comments
    setSending(true)
    try {
      await http.put(
        endpoints.requestById(request.id),
        {
          status: "in-progress",
          qaFeedback: feedbackText.trim() || undefined,
          qaComments: nextComments,
        },
        { withCredentials: true }
      )
      toast.success("Feedback sent to employee for rework")
      router.push("/qa")
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to send feedback")
    } finally {
      setSending(false)
    }
  }

  const addComment = () => {
    if (!newComment.trim() || !request) return
    const next = [
      ...(request.qaComments ?? []),
      { id: `c-${Date.now()}`, text: newComment.trim(), createdAt: new Date().toISOString() },
    ]
    setRequest({ ...request, qaComments: next })
    setNewComment("")
  }

  const handleMapClickForComment = (evt: { lngLat: [number, number]; pixel: [number, number] }) => {
    setPendingComment({ lngLat: evt.lngLat, pixel: evt.pixel })
  }

  const handleSaveCommentAtPosition = (text: string) => {
    if (!request || !pendingComment) return
    const next = [
      ...(request.qaComments ?? []),
      {
        id: `c-${Date.now()}`,
        text,
        position: pendingComment.lngLat,
        createdAt: new Date().toISOString(),
      },
    ]
    setRequest({ ...request, qaComments: next })
    setPendingComment(null)
    setAddCommentMode(false)
  }

  const handleCancelCommentAtPosition = () => {
    setPendingComment(null)
    setAddCommentMode(false)
  }

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground mb-4">Sign in as QA to review.</p>
        <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </div>
    )
  }

  if (loading || !request) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const comments = request.qaComments ?? []

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/qa")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl truncate">{request.title}</h1>
          <p className="text-muted-foreground text-sm font-mono">{request.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Submitted file (map)
                </CardTitle>
                <CardDescription>Employee&apos;s submitted geometry and measurements. Click &quot;Add comment&quot; then click on the map to place a comment.</CardDescription>
              </div>
              <Button
                type="button"
                variant={addCommentMode ? "default" : "outline"}
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setAddCommentMode((v) => !v)}
              >
                <MessageSquare className="h-4 w-4" />
                {addCommentMode ? "Placing comment… (click map)" : "Add comment"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <RequestMapView
                geometry={request.geometry}
                className="w-full h-[360px]"
                comments={request.qaComments ?? []}
                addCommentMode={addCommentMode}
                onMapClick={handleMapClickForComment}
                pendingCommentPixel={pendingComment?.pixel ?? null}
                onSaveComment={handleSaveCommentAtPosition}
                onCancelComment={handleCancelCommentAtPosition}
              />
            </CardContent>
          </Card>

          {(request.takeoffItems?.length ?? 0) > 0 && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Takeoff summary</CardTitle>
                <CardDescription>Measurements in this submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Label</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-right p-2 font-medium">Area (sq ft)</th>
                        <th className="text-right p-2 font-medium">Length (ft)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.takeoffItems!.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.label}</td>
                          <td className="p-2">{item.type}</td>
                          <td className="p-2 text-right">{item.area ?? "—"}</td>
                          <td className="p-2 text-right">{item.length ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments on this file
              </CardTitle>
              <CardDescription>Add comments (with or without a map position). Use &quot;Add comment&quot; on the map to place a comment at a specific location.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                />
                <Button size="sm" variant="secondary" onClick={addComment} disabled={!newComment.trim()}>
                  Add
                </Button>
              </div>
              {comments.length > 0 && (
                <ul className="space-y-2">
                  {comments.map((c) => (
                    <li key={c.id} className="text-sm p-2 rounded bg-muted/50 border">
                      {c.text}
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Review actions</CardTitle>
              <CardDescription>Approve or send back with feedback for rework</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Feedback (for send back)</Label>
                <Textarea
                  placeholder="Describe what the employee should fix or improve..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="gap-2 w-full"
                  disabled={sending}
                  onClick={handleApprove}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  disabled={sending}
                  onClick={handleSendFeedback}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send feedback (rework)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Status:</span> {request.status.replace(/-/g, " ")}</p>
              <p><span className="text-muted-foreground">Category:</span> {request.category?.replace(/-/g, " ")}</p>
              {request.propertyAddress && (
                <p><span className="text-muted-foreground">Address:</span> {request.propertyAddress}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
