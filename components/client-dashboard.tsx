"use client"

import { useCallback, useMemo, useState } from "react"
import MapApp from "@/components/map-app"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useTasksStore } from "@/lib/tasks-store"
import { statusLabel, type Task } from "@/lib/task-types"

export default function ClientDashboard() {
  const { tasks, clientId, addTask } = useTasksStore()
  const [pendingFeature, setPendingFeature] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const myTasks = useMemo(() => tasks.filter((t) => t.clientId === clientId), [tasks, clientId])

  const onFeatureDrawn = useCallback((feature: any) => {
    setPendingFeature(feature)
    setOpen(true)
  }, [])

  const submitTask = useCallback(() => {
    if (!pendingFeature || !title.trim()) return
    const created = addTask({ title: title.trim(), description: description.trim(), geometry: pendingFeature })
    setOpen(false)
    setPendingFeature(null)
    setTitle("")
    setDescription("")
    console.log("[v0] Task created:", created.id)
  }, [pendingFeature, title, description, addTask])

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-pretty">Client Dashboard</h1>
        <div className="flex items-center gap-2">
          {/* <Badge variant="secondary">Your ID: {clientId?.slice(0, 8)}</Badge> */}
          <Button asChild variant="outline">
            <a href="/admin">Go to Admin</a>
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="">
            <MapApp onFeatureDrawn={onFeatureDrawn} userRole="client" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No requests yet. Draw an area on the map and submit.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {myTasks.map((t) => (
                <ClientTaskItem key={t.id} task={t} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Measurement Request</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Describe what needs to be measured..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitTask} disabled={!title.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClientTaskItem({ task }: { task: Task }) {
  return (
    <Card>
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{task.title}</div>
          <Badge>{statusLabel[task.status]}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{task.description || "No description"}</div>
        <div className="text-[11px] text-muted-foreground">Created: {new Date(task.createdAt).toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
