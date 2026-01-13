import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { statusLabel, type Task } from "@/lib/task-types"
import { Badge } from 'lucide-react'
import { useTasksStore } from '@/lib/tasks-store'
const TaskItem = () => {
  const { tasks,clientId } = useTasksStore()

  const myTasks = useMemo(() => tasks.filter((t) => t.clientId === clientId), [tasks, clientId])
    const  ClientTaskItem=({ task }: { task: Task })=> {
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
  return (
    <div>   <Card>
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
      </Card></div>
  )
}

export default TaskItem