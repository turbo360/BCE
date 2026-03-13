import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const responses = db
    .prepare("SELECT case_study_id, content, updated_at FROM responses WHERE user_id = ?")
    .all(session.userId);

  return NextResponse.json({ responses });
}

export async function PUT(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Check if already submitted
  const user = db.prepare("SELECT submitted_at FROM users WHERE id = ?").get(session.userId) as { submitted_at: string | null } | undefined;
  if (user?.submitted_at) {
    return NextResponse.json({ error: "Responses have already been submitted and cannot be edited." }, { status: 403 });
  }

  const { caseStudyId, content } = await request.json();

  if (!caseStudyId) {
    return NextResponse.json({ error: "caseStudyId is required" }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO responses (user_id, case_study_id, content, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, case_study_id)
    DO UPDATE SET content = excluded.content, updated_at = datetime('now')
  `).run(session.userId, caseStudyId, content || "");

  return NextResponse.json({ success: true });
}
