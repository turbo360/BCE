import { NextResponse } from "next/server";
import { createAdminToken, ADMIN_COOKIE } from "@/lib/auth";

const ADMIN_PIN = "2221";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (pin !== ADMIN_PIN) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
    }

    const token = createAdminToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
