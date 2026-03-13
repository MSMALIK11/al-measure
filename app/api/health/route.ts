import { NextRequest, NextResponse } from "next/server"
import { addCors, corsPreflight } from "@/lib/cors"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return addCors(request, NextResponse.json({ error: "MongoDB not configured" }, { status: 503 }))
    }
    const { default: connectDB } = await import("@/app/api/db/mongoose")
    await connectDB()
    return addCors(request, NextResponse.json({ status: "ok" }))
  } catch (error: any) {
    return addCors(request, NextResponse.json({ error: error.message }, { status: 503 }))
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
