"use client"

import { useMemo, useState } from "react"
import { useTasksStore } from "@/lib/tasks-store"
import { statusLabel, type Task, type TaskStatus } from "@/lib/task-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export default function AdminDashboard() {
  const { tasks } = useTasksStore()
  const [filter, setFilter] = useState<"all" | TaskStatus>("all")

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">{statusLabel.pending}</SelectItem>
              <SelectItem value="under_review">{statusLabel.under_review}</SelectItem>
              <SelectItem value="completed">{statusLabel.completed}</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <a href="/client">Go to Client</a>
          </Button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No tasks to display.</div>
      ) : (
        <Table>
          <TableCaption>A list of client tasks</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((task) => (
              <AdminTaskRow key={task.id} task={task} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function AdminTaskRow({ task }: { task: Task }) {
  const { setStatus, removeTask } = useTasksStore()

  return (
    <TableRow>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {task.description || "No description"}
      </TableCell>
      <TableCell>
        <Badge>{statusLabel[task.status]}</Badge>
      </TableCell>
      <TableCell className="text-xs">
        {new Date(task.createdAt).toLocaleString()}
      </TableCell>
      <TableCell className="text-xs">{task.clientId.slice(0, 8)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setStatus(task.id, "pending")}>
              Mark Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(task.id, "under_review")}>
              Under Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(task.id, "completed")}>
              Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => removeTask(task.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
