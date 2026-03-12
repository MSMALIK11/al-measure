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
  ArrowLeft,
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

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

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
            <Link href="/login">
              <Button size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground">Our products</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            We build and sell software for landscape measurement, request management, QA, field
            operations, and admin control.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription>{product.tagline}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      <footer className="relative z-10 mt-auto border-t border-border bg-card/50 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Al Measure.
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>
      </footer>
    </div>
  )
}
