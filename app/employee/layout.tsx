"use client"

import Sidebar, { NavItem } from "@/components/shared/Sidebar"
import { ClipboardList } from "lucide-react"

const navItems: NavItem[] = [
  { name: "My Tasks", href: "/employee", icon: ClipboardList },
]

export default function EmployeeLayout({
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
        subtitle="Employee"
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
