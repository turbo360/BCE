import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const recipients = db.prepare("SELECT * FROM notification_recipients ORDER BY created_at DESC").all();
  return NextResponse.json({ recipients });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const db = getDb();
  try {
    db.prepare("INSERT INTO notification_recipients (email, name) VALUES (?, ?)").run(email, name || "");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM notification_recipients WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
