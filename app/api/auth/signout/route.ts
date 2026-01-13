import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json({
            message: "Signed out successfully",
        });

        // Clear the authentication cookie
        response.cookies.set({
            name: "token",
            value: "",
            httpOnly: true,
            path: "/",
            maxAge: 0, // Expire immediately
        });

        return response;
    } catch (error: any) {
        console.error("Signout error:", error);
        return NextResponse.json(
            { error: "An error occurred during logout. Please try again." },
            { status: 500 }
        );
    }
}
