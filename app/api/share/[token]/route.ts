import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../db/mongoose";
import Request from "../../requests/request.schema";

/** Public: get request by share token (view-only) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }
    await connectDB();
    const doc = await Request.findOne({ shareToken: token }).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: "Not found or link expired" }, { status: 404 });
    }
    const r = doc as any;
    return NextResponse.json({
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
        propertyAddress: r.propertyAddress,
        propertySize: r.propertySize,
        propertyFeatures: r.propertyFeatures || [],
        createdAt: r.createdAt?.toISOString?.() || r.createdAt,
        updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/share/[token] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
