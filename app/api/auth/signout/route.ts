import { NextRequest, NextResponse } from "next/server";
import { addCors, corsPreflight } from "@/lib/cors";

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json({ message: "Signed out successfully" });
        response.cookies.set({
            name: "token",
            value: "",
            httpOnly: true,
            path: "/",
            maxAge: 0,
        });
        return addCors(request, response);
    } catch (error: any) {
        console.error("Signout error:", error);
        return addCors(request, NextResponse.json(
            { error: "An error occurred during logout. Please try again." },
            { status: 500 }
        ));
    }
}

export async function OPTIONS(request: NextRequest) {
    return corsPreflight(request);
}
