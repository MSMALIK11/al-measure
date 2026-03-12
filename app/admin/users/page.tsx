"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage admin and employee accounts
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>

      <UserManagement />
    </div>
  )
}
