import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../db/mongoose";
import Request from "../../request.schema";
import { Types } from "mongoose";
import crypto from "crypto";
import { addCors, corsPreflight } from "@/lib/cors";

function toResponse(r: any) {
  return {
    id: r._id.toString(),
    title: r.title,
    description: r.description,
    category: r.category,
    takeoffIndustry: r.takeoffIndustry,
    priority: r.priority,
    status: r.status,
    geometry: r.geometry,
    takeoffItems: r.takeoffItems || [],
    clientName: r.clientName,
    propertyAddress: r.propertyAddress,
    propertySize: r.propertySize,
    propertyFeatures: r.propertyFeatures || [],
    createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
  };
}

/** Generate or get shareable link token */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return addCors(request, NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 }));
    }
    await connectDB();
    const token = crypto.randomBytes(24).toString("hex");
    const doc = await Request.findByIdAndUpdate(
      id,
      { $set: { shareToken: token } },
      { new: true }
    ).lean();
    if (!doc) {
      return addCors(request, NextResponse.json({ success: false, error: "Request not found" }, { status: 404 }));
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return addCors(request, NextResponse.json({
      success: true,
      shareToken: token,
      shareUrl: `${baseUrl}/share/${token}`,
      data: toResponse(doc),
    }));
  } catch (error: any) {
    console.error("POST /api/requests/[id]/share error:", error);
    return addCors(request, NextResponse.json({ success: false, error: error.message }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}
