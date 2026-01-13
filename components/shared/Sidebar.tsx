"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LucideIcon, LogOut, ChevronRight, Menu, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  subItems?: { name: string; href: string }[]
}

interface SidebarProps {
  navItems: NavItem[]
  title?: string
  subtitle?: string
  logout?: () => void
  userInfo?: {
    name: string
    email: string
    role: string
  }
}

export default function Sidebar({ 
  navItems, 
  title = "Al Measure", 
  subtitle,
  logout,
  userInfo
}: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-900 shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Image 
              src="/brand_logo.png" 
              alt="Al Measure" 
              width={48} 
              height={48}
              className="rounded-lg"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href)
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedItems.includes(item.name)

            return (
              <div key={item.name}>
                {hasSubItems ? (
                  <Button
                    variant="ghost"
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium transition-all",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left text-sm">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </Button>
                ) : (
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium transition-all",
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left text-sm">{item.name}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full absolute right-0" />
                      )}
                    </Button>
                  </Link>
                )}

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start px-3 py-2 h-auto text-sm transition-all",
                              isSubActive
                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                            )}
                          >
                            {subItem.name}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* User Info */}
          {userInfo && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userInfo.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userInfo.email}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                  {userInfo.role}
                </span>
              </div>
            </div>
          )}

          {/* Theme Toggle & Logout */}
          <div className="p-4 space-y-2">
            <ThemeToggle />
            
            {logout && (
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
