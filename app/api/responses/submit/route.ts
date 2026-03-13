import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const user = db.prepare("SELECT submitted_at FROM users WHERE id = ?").get(session.userId) as { submitted_at: string | null } | undefined;
  if (user?.submitted_at) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  db.prepare("UPDATE users SET submitted_at = datetime('now') WHERE id = ?").run(session.userId);

  return NextResponse.json({ success: true });
}
