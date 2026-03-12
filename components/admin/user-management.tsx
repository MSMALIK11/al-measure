"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2 } from "lucide-react"
import { AddUserDialog } from "./add-user-dialog"
import http from "@/services/http"
import { endpoints } from "@/services/modules/endpoints"
import { toast } from "sonner"

interface ApiUser {
  id: string
  name: string
  email: string
  role: string
}

export function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await http.get(endpoints.users, { withCredentials: true })
      setUsers(data.data ?? [])
    } catch (e) {
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const employees = users.filter((u) => u.role === "employee")
  const qaUsers = users.filter((u) => u.role === "qa")
  const admins = users.filter((u) => u.role === "admin")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm">Manage employees and administrators. Add users to assign to requests.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 font-semibold text-lg">Employees ({employees.length})</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No employees yet. Add one to assign requests.</p>
            ) : (
              <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
                {employees.map((user) => (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <CardDescription className="text-sm">{user.email}</CardDescription>
                        </div>
                        <Badge variant="secondary">Employee</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">QA ({qaUsers.length})</h3>
            {qaUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No QA users yet.</p>
            ) : (
              <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
                {qaUsers.map((user) => (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <CardDescription className="text-sm">{user.email}</CardDescription>
                        </div>
                        <Badge variant="secondary">QA</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">Administrators ({admins.length})</h3>
            {admins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No administrators in the list.</p>
            ) : (
              <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
                {admins.map((user) => (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <CardDescription className="text-sm">{user.email}</CardDescription>
                        </div>
                        <Badge variant="secondary">Admin</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddUserDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={fetchUsers} />
    </div>
  )
}
