"use client"

import Sidebar, { NavItem } from "@/components/shared/Sidebar"
import { Users, FileText, Activity } from "lucide-react"

const navItems: NavItem[] = [
  { name: "Requests", href: "/admin", icon: FileText },
  { name: "Process", href: "/admin/process", icon: Activity },
  { name: "Users", href: "/admin/users", icon: Users },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const handleLogout = () => {
    window.location.href = "/login"
  }

  return (
    <main className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        title="Al-Measure"
        subtitle="Admin"
        navItems={navItems}
        logout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 lg:p-8 overflow-auto bg-muted/30 transition-opacity duration-200">
          <div className="page-container">{children}</div>
        </div>
      </div>
    </main>
  )
}
