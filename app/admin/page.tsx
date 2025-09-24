"use client"

import AdminDashboard from "@/components/admin-dashboard"
import Sidebar, { NavItem } from "@/components/shared/Sidebar"
import { Home, ClipboardList, Users, Settings } from "lucide-react"

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Tasks", href: "/admin/tasks", icon: ClipboardList },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function Page() {
  const handleLogout = () => {
    console.log("Logout clicked")
  }

  return (
    <main className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar navItems={navItems} logout={handleLogout} />

      {/* Content area */}
      <div className="flex-1 p-6 overflow-auto">
        <AdminDashboard />
      </div>
    </main>
  )
}
