import { NextResponse, type NextRequest } from "next/server";
import { MINOR_ADMIN_PATHS, SESSION_COOKIE, verifySession } from "@/lib/server/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS for the mobile app calling public APIs.
  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/payments")) {
    if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: corsHeaders() });
    const res = NextResponse.next();
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (session.role !== "main_admin" && !MINOR_ADMIN_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = { matcher: ["/admin/:path*", "/api/public/:path*", "/api/payments/:path*"] };
