import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, cohort } = await request.json();

    if (!email || !cohort || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const db = getDb();

    // Check if user already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ error: "This email is already registered. Please use Sign In." }, { status: 409 });
    }

    const result = db.prepare("INSERT INTO users (first_name, last_name, email, cohort) VALUES (?, ?, ?, ?)").run(firstName, lastName, email, cohort);
    const userId = result.lastInsertRowid as number;

    const token = createToken(userId, email);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
