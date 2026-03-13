import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyTokenEdge(token: string, secret: string): Promise<boolean> {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expected === signature;
  } catch {
    return false;
  }
}

const SECRET = process.env.SECRET_KEY || "bce-case-studies-secret-2025";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect user routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/case-study")) {
    const token = request.cookies.get("bce_session")?.value;
    if (!token || !(await verifyTokenEdge(token, SECRET))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect user API routes
  if (pathname.startsWith("/api/responses")) {
    const token = request.cookies.get("bce_session")?.value;
    if (!token || !(await verifyTokenEdge(token, SECRET))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("bce_admin")?.value;
    if (!token || !(await verifyTokenEdge(token, SECRET))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/case-study/:path*", "/api/responses/:path*", "/api/admin/:path*"],
};
