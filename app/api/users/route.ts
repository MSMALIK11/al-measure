import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../db/mongoose";
import User from "../modules/user.schema";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["admin", "employee", "qa"]),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const filter: Record<string, unknown> = {};
    if (role && ["admin", "employee", "client", "qa"].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter).select("name email role").sort({ name: 1 }).lean();

    const data = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const u = user.toObject();
    return NextResponse.json({
      success: true,
      data: {
        id: (u as any)._id.toString(),
        name: (u as any).name,
        email: (u as any).email,
        role: (u as any).role,
      },
    });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
