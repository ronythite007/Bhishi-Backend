import { NextResponse, type NextRequest } from "next/server";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function getAllowedOrigins(): string[] {
  const configured = process.env.FRONTEND_ORIGIN?.trim();
  if (configured) {
    return configured
      .split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean);
  }

  return [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.vercel.app",
    "https://bhishi-frontend.vercel.app",
  ];
}

function originMatches(origin: string, allowedOrigin: string): boolean {
  if (allowedOrigin === origin) return true;

  // Supports patterns like "https://*.vercel.app".
  if (allowedOrigin.includes("*")) {
    const regex = new RegExp(`^${allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i");
    return regex.test(origin);
  }

  return false;
}

function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;

  if (normalizedOrigin && allowedOrigins.some((allowedOrigin) => originMatches(normalizedOrigin, allowedOrigin))) {
    response.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Method");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  const requestedHeaders = request.headers.get("access-control-request-headers");
  response.headers.set(
    "Access-Control-Allow-Headers",
    requestedHeaders && requestedHeaders.trim().length > 0
      ? requestedHeaders
      : "Content-Type, Authorization",
  );

  return response;
}

export function middleware(request: NextRequest): NextResponse {
  if (request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(request, preflightResponse);
  }

  return applyCorsHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
