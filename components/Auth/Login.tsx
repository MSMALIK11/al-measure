"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import  api from '@/services/http'  
import { useToast } from "../ui/use-toast"
export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
const {toast}=useToast()
  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" })

  // Basic validation
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!loginData.email || !loginData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }
    if (!validateEmail(loginData.email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address",
      })
      return
    }

    setLoading(true)
    try {
      const payload: any = { email: loginData.email, password: loginData.password }
      const res = await api.post('/auth/signin', payload)
      
      toast({
        title: "Success",
        description: "Welcome back!",
      })
      
      const userRole = res.data?.user?.role
      if (userRole === "admin") router.push("/admin")
      else if (userRole === "employee") router.push("/developer")
      else router.push("/client")
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || "Login failed"
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }
    if (!validateEmail(registerData.email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address",
      })
      return
    }
    if (registerData.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long",
      })
      return
    }

    setLoading(true)
    try {
      const res = await api.post("/auth/signup", { ...registerData, role: "client" })
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      })
      
      const userRole = res.data?.user?.role
      if (userRole === "admin") router.push("/admin")
      else if (userRole === "employee") router.push("/developer")
      else router.push("/client")
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || "Registration failed"
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  const switchView = (newView: "login" | "register") => {
    setView(newView)
    setLoginData({ email: "", password: "" })
    setRegisterData({ name: "", email: "", password: ""})
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Image src="/brand_logo.png" alt="Al Measure" width={120} height={100} className="mb-4" />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Precision Measurement<br />Made Simple
            </h1>
            <p className="text-lg text-white/90 max-w-md">
              Transform your landscape measurement workflow with AI-powered tools designed for accuracy and efficiency.
            </p>
          </div>
          
          <div className="flex justify-between text-sm text-white/70">
            <span>© 2025 Al Measure Inc.</span>
            <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {view === "login" ? "Welcome Back" : "Get Started"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {view === "login" 
                ? "Sign in to access your dashboard" 
                : "Create an account to start measuring"}
            </p>
          </div>

          {/* Login Form */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password (min. 8 characters)"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {/* Toggle View */}
          <div className="mt-6 text-center text-sm">
            {view === "login" ? (
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("register")}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden mt-8 text-center">
            <Image 
              src="/brand_logo.png" 
              alt="Al Measure" 
              width={80} 
              height={70} 
              className="mx-auto opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
