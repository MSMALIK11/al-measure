// app/client/layout.tsx
"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/shared/Sidebar"
import { NavItem } from "@/components/shared/Sidebar"
import { GitPullRequestDraft, Home, Settings } from "lucide-react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Hide sidebar on request page for more space
  const shouldHideSidebar = pathname?.includes("/client/request")

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/client", icon: Home },
    { name: "Request", href: "/client/request", icon: GitPullRequestDraft },
    { name: "Settings", href: "/client/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - Hidden on request page */}
      {!shouldHideSidebar && (
        <Sidebar navItems={navItems} title="Dashboard" />
      )}

      {/* Main content / child route */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>
    </div>
  )
}
