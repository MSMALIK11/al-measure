import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../modules/user.schema";
import connectDB from "../../db/mongoose";
import { registerSchema } from "../validators";
import { addCors, corsPreflight } from "@/lib/cors";

const JWT_SECRET = process.env.JWT_SECRET || "thisismeshoaibfuturebillionaire";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return addCors(request, NextResponse.json(
                {
                    error: "Validation failed",
                    details: validation.error.errors.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                },
                { status: 400 }
            ));
        }

        const { name, email, password, role } = validation.data;

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return addCors(request, NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 409 }
            ));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "client",
        });

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send response with cookie
        const response = NextResponse.json(
            {
                message: "Account created successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return addCors(request, response);
    } catch (error: any) {
        console.error("Signup error:", error);
        return addCors(request, NextResponse.json(
            { error: "An error occurred during registration. Please try again." },
            { status: 500 }
        ));
    }
}

export async function OPTIONS(request: NextRequest) {
    return corsPreflight(request);
}
