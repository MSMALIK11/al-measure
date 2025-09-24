"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  color?: string
}

interface SidebarProps {
  navItems: NavItem[]
  title?: string
  logout?: () => void
}

export default function Sidebar({ navItems, title = "Admin Panel", logout }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-100 flex flex-col justify-between border-r border-gray-800">
      {/* Header / Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors duration-150 ${
                  isActive ? "bg-gray-800 font-semibold" : ""
                }`}
                style={{ color: item.color || "inherit" }}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      {logout && (
        <div className="p-6 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-4 py-2 rounded-md hover:bg-gray-800 text-red-500 transition-colors duration-150"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      )}
    </aside>
  )
}
