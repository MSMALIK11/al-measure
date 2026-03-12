import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../modules/user.schema";
import connectDB from "../../db/mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "thisismeshoaibfuturebillionaire";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      email?: string;
      role?: string;
    };
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("name email role").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: (user as any)._id.toString(),
        name: (user as any).name,
        email: (user as any).email,
        role: (user as any).role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized", message: error.message }, { status: 401 });
  }
}
