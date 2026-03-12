"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LucideIcon, LogOut, ChevronRight, Menu, X, ExternalLink } from "lucide-react"
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
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border-border shadow-md"
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
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col transition-transform duration-200 ease-out",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Image
              src="/brand_logo.png"
              alt="Al Measure"
              width={40}
              height={40}
              className="rounded-lg shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
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
                      "w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge != null && (
                      <span className="min-w-[1.25rem] py-0.5 text-xs font-medium rounded-full bg-destructive/90 text-destructive-foreground text-center">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={cn("h-4 w-4 shrink-0 opacity-70 transition-transform", isExpanded && "rotate-90")}
                    />
                  </Button>
                ) : (
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium rounded-lg relative transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge != null && (
                        <span className="min-w-[1.25rem] py-0.5 text-xs font-medium rounded-full bg-destructive/90 text-destructive-foreground text-center">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary rounded-r-full" />
                      )}
                    </Button>
                  </Link>
                )}

                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-0.5 pl-3 border-l border-sidebar-border space-y-0.5">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link key={subItem.name} href={subItem.href} onClick={() => setIsOpen(false)}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start px-3 py-2 h-auto text-sm rounded-md transition-colors",
                              isSubActive
                                ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
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
        <div className="shrink-0 border-t border-sidebar-border">
          {userInfo && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{userInfo.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">{userInfo.email}</p>
                </div>
              </div>
              <span className="mt-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-sidebar-accent/50 text-sidebar-accent-foreground capitalize">
                {userInfo.role}
              </span>
            </div>
          )}
          <div className="p-3 space-y-1">
            <a
              href="https://arshionixsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <span>Powered by Arshionix Solutions</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </a>
            <ThemeToggle />
            {logout && (
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
