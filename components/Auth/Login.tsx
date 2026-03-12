"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Shield, UserPlus } from "lucide-react"
import api from "@/services/http"
import { useToast } from "../ui/use-toast"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" })

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginData.email || !loginData.password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" })
      return
    }
    if (!validateEmail(loginData.email)) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid email address" })
      return
    }
    setLoading(true)
    try {
      const res = await api.post("/auth/signin", { email: loginData.email, password: loginData.password })
      toast({ title: "Success", description: "Welcome back!" })
      const userRole = res.data?.user?.role
      if (userRole === "admin") router.push("/admin")
      else if (userRole === "employee") router.push("/employee")
      else if (userRole === "qa") router.push("/qa")
      else router.push("/client")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.response?.data?.message || "Login failed",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" })
      return
    }
    if (!validateEmail(registerData.email)) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid email address" })
      return
    }
    if (registerData.password.length < 8) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 8 characters long" })
      return
    }
    setLoading(true)
    try {
      const res = await api.post("/auth/signup", { ...registerData, role: "client" })
      toast({ title: "Success", description: "Account created successfully!" })
      const userRole = res.data?.user?.role
      if (userRole === "admin") router.push("/admin")
      else if (userRole === "employee") router.push("/employee")
      else if (userRole === "qa") router.push("/qa")
      else router.push("/client")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.response?.data?.message || "Registration failed",
      })
    } finally {
      setLoading(false)
    }
  }

  const switchView = (newView: "login" | "register") => {
    setView(newView)
    setLoginData({ email: "", password: "" })
    setRegisterData({ name: "", email: "", password: "" })
    setShowPassword(false)
  }

  const roles = [
    { label: "Admin", color: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20" },
    { label: "Employee", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
    { label: "QA", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
    { label: "Client", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg">
                <Image
                  src="/brand_logo.png"
                  alt="Al Measure"
                  width={100}
                  height={84}
                  className="h-12 w-auto object-contain dark:opacity-95"
                />
              </Link>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {view === "login" ? "Sign in" : "Create account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {view === "login"
                  ? "Use your credentials to access your dashboard"
                  : "Register as a client to submit requests"}
              </p>
            </div>

            {/* Role badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {roles.map((r) => (
                <span
                  key={r.label}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    r.color
                  )}
                >
                  {r.label}
                </span>
              ))}
            </div>

            {/* Login Form */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="h-11 bg-muted/50 border-border"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="h-11 pr-10 bg-muted/50 border-border"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Sign in
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {view === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="h-11 bg-muted/50 border-border"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@company.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="h-11 bg-muted/50 border-border"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="h-11 pr-10 bg-muted/50 border-border"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center text-sm">
              {view === "login" ? (
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("register")}
                    className="font-medium text-primary hover:underline"
                    disabled={loading}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="font-medium text-primary hover:underline"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Al Measure.{" "}
          <Link href="/" className="hover:text-foreground underline-offset-2 hover:underline">Home</Link>
          {" · "}
          <Link href="/products" className="hover:text-foreground underline-offset-2 hover:underline">Products</Link>
          {" · "}
          Sign in as Admin, Employee, QA, or Client.
        </p>
      </div>
    </div>
  )
}
