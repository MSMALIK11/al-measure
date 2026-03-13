import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://al-measure.netlify.app",
  "https://www.al-measure.netlify.app",
  "http://localhost:3000",
];

const CORS_HEADERS = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
});

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;

  if (request.method === "OPTIONS") {
    const headers = allowedOrigin ? CORS_HEADERS(allowedOrigin) : {};
    return new NextResponse(null, { status: 204, headers: headers as HeadersInit });
  }

  const response = NextResponse.next();
  if (allowedOrigin) {
    Object.entries(CORS_HEADERS(allowedOrigin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}
