import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../db/mongoose";
import Request from "../request.schema";
import { Types } from "mongoose";

function toResponse(r: any) {
  const qaComments = Array.isArray(r.qaComments)
    ? r.qaComments.map((c: any) => ({
        id: c.id,
        text: c.text,
        position: c.position && Array.isArray(c.position) ? [...c.position] : undefined,
        createdAt: c.createdAt,
      }))
    : [];
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
    clientEmail: r.clientEmail,
    propertyAddress: r.propertyAddress,
    propertySize: r.propertySize,
    propertyFeatures: r.propertyFeatures || [],
    assignedTo: r.assignedTo?.toString(),
    notes: r.notes,
    attachments: r.attachments,
    estimatedCompletion: r.estimatedCompletion,
    shareToken: r.shareToken,
    qaFeedback: r.qaFeedback,
    qaComments,
    createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Request.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: toResponse(doc) });
  } catch (error: any) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }
    await connectDB();
    const body = await request.json();
    const allowed = [
      "title",
      "description",
      "category",
      "takeoffIndustry",
      "priority",
      "status",
      "geometry",
      "takeoffItems",
      "propertyAddress",
      "propertySize",
      "propertyFeatures",
      "assignedTo",
      "notes",
      "attachments",
      "estimatedCompletion",
      "qaFeedback",
      "qaComments",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.qaComments !== undefined) {
      updates.qaComments = Array.isArray(body.qaComments)
        ? body.qaComments.map((c: any) => ({
            id: String(c?.id ?? ""),
            text: String(c?.text ?? ""),
            position: Array.isArray(c?.position) ? c.position.map((n: any) => Number(n)) : undefined,
            createdAt: String(c?.createdAt ?? new Date().toISOString()),
          }))
        : [];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }
    const doc = await Request.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: toResponse(doc) });
  } catch (error: any) {
    console.error("PUT /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Request.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Request deleted" });
  } catch (error: any) {
    console.error("DELETE /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
