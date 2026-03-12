"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Compass,
  FileSearch,
  CheckCircle2,
  Hammer,
  LayoutDashboard,
  LogIn,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"
import { cn } from "@/lib/utils"

const iconMap = {
  Compass,
  FileSearch,
  CheckCircle2,
  Hammer,
  LayoutDashboard,
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand_logo.png"
              alt="Al Measure"
              width={100}
              height={84}
              className="h-9 w-auto object-contain dark:opacity-95"
            />
            <span className="font-semibold text-foreground hidden sm:inline">Al-Measure</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/#products">
              <Button variant="ghost" size="sm" className="gap-2">
                <Package className="h-4 w-4" />
                Products
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-4 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto">
          AI-powered landscape measurement
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          From takeoff to field ops — measure, scope, verify, and deliver with one platform.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/#products">
            <Button size="lg" variant="default" className="gap-2">
              <Package className="h-4 w-4" />
              View products
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="gap-2">
              Get started
            </Button>
          </Link>
        </div>
      </section>

      {/* Products section */}
      <section id="products" className="relative z-10 container mx-auto px-4 py-16 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">What we build & sell</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Software products that power measurement, requests, QA, field work, and operations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => {
            const Icon = iconMap[product.icon as keyof typeof iconMap] ?? Compass
            return (
              <Card
                key={product.id}
                className={cn(
                  "overflow-hidden transition-shadow hover:shadow-md",
                  "border-border bg-card"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-xs">{product.tagline}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products">
            <Button variant="outline" size="sm">
              See all products
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Al Measure. AI-powered landscape measurement.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/#products" className="text-sm text-muted-foreground hover:text-foreground">
              Products
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
