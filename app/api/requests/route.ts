import { NextRequest, NextResponse } from "next/server";
import connectDB from "../db/mongoose";
import Request from "./request.schema";
import { addCors, corsPreflight } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const clientId = searchParams.get("clientId");
    const assignedTo = searchParams.get("assignedTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (clientId) filter.clientId = clientId;
    if (assignedTo) filter.assignedTo = assignedTo;

    const [data, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);

    const requests = data.map((r: any) => ({
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
      qaComments: Array.isArray(r.qaComments) ? r.qaComments : [],
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    }));

    return addCors(request, NextResponse.json({
      success: true,
      data: requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }));
  } catch (error: any) {
    console.error("GET /api/requests error:", error);
    return addCors(request, NextResponse.json({ success: false, error: error.message }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      title,
      description,
      category,
      takeoffIndustry,
      priority,
      geometry,
      takeoffItems,
      clientName,
      clientEmail,
      propertyAddress,
      propertySize,
      propertyFeatures,
      clientId,
      notes,
      attachments,
    } = body;

    if (!title || !description || !category || !geometry) {
      return addCors(request, NextResponse.json(
        { success: false, error: "Missing required fields: title, description, category, geometry" },
        { status: 400 }
      ));
    }

    const doc = await Request.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      takeoffIndustry: takeoffIndustry || undefined,
      priority: priority || "medium",
      status: "pending",
      geometry,
      takeoffItems: Array.isArray(takeoffItems) ? takeoffItems : [],
      clientId: clientId || undefined,
      clientName: clientName || "Unknown Client",
      clientEmail: clientEmail || "",
      propertyAddress: propertyAddress || "",
      propertySize: propertySize ?? "",
      propertyFeatures: Array.isArray(propertyFeatures) ? propertyFeatures : [],
      notes: notes || undefined,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const r = doc.toObject();
    return addCors(request, NextResponse.json({
      success: true,
      data: {
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
        createdAt: r.createdAt?.toISOString?.() || r.createdAt,
        updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
      },
    }));
  } catch (error: any) {
    console.error("POST /api/requests error:", error);
    return addCors(request, NextResponse.json({ success: false, error: error.message }, { status: 500 }));
  }
}
