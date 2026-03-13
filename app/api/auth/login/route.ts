import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email) as { id: number; email: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: "No account found with this email. Please register first." }, { status: 404 });
    }

    const token = createToken(user.id, user.email);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
