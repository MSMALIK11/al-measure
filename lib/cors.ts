import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://al-measure.netlify.app",
  "https://www.al-measure.netlify.app",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    "Access-Control-Allow-Headers":
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  };
}

/** Add CORS headers to a response (use in API routes so Netlify serverless responses include CORS). */
export function addCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

/** Return 204 for OPTIONS preflight with CORS headers (call from OPTIONS handler in API routes). */
export function corsPreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: headers as HeadersInit });
}
