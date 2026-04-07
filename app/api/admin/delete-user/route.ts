import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const tx = db.transaction((id: number) => {
    db.prepare("DELETE FROM responses WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });
  tx(Number(userId));

  return NextResponse.json({ success: true });
}
