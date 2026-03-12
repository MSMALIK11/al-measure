"use client"

import Sidebar, { NavItem } from "@/components/shared/Sidebar"
import { ClipboardCheck } from "lucide-react"

const navItems: NavItem[] = [
  { name: "Review queue", href: "/qa", icon: ClipboardCheck },
]

export default function QALayout({ children }: { children: React.ReactNode }) {
  const handleLogout = () => {
    window.location.href = "/login"
  }

  return (
    <main className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        title="Al-Measure"
        subtitle="QA"
        navItems={navItems}
        logout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 lg:p-8 overflow-auto bg-muted/30">
          <div className="page-container">{children}</div>
        </div>
      </div>
    </main>
  )
}
