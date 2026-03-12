"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle2, ListTodo } from "lucide-react"
import type { ServiceRequest, User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AdminStatsProps {
  requests: ServiceRequest[]
  users: User[]
}

export function AdminStats({ requests, users }: AdminStatsProps) {
  const total = requests.length
  const pending = requests.filter(
    (r) => r.status === "pending" || r.status === "pending-qa" || r.status === "qa-approved"
  ).length
  const inProgress = requests.filter((r) => r.status === "in-progress").length
  const completed = requests.filter((r) => r.status === "completed").length

  const cards = [
    {
      label: "Total",
      value: total,
      sub: "All requests",
      icon: FileText,
      className: "border-slate-200 dark:border-slate-800",
      iconClass: "text-slate-600 dark:text-slate-400",
    },
    {
      label: "Pending",
      value: pending,
      sub: "Awaiting action",
      icon: Clock,
      className: "border-amber-200 dark:border-amber-900/50",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "In progress",
      value: inProgress,
      sub: "Active",
      icon: ListTodo,
      className: "border-blue-200 dark:border-blue-900/50",
      iconClass: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: completed,
      sub: "Done",
      icon: CheckCircle2,
      className: "border-emerald-200 dark:border-emerald-900/50",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((item, index) => {
        const Icon = item.icon
        return (
          <Card
            key={item.label}
            className={cn(
              "overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
              item.className
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className={cn("h-4 w-4", item.iconClass)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
