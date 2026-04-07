import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { generateSubmissionDocx } from "@/lib/docx";
import { sendSubmissionEmail } from "@/lib/email";
import type { Module, CaseStudy } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as {
    id: number; first_name: string; last_name: string; email: string; cohort: string; submitted_at: string | null;
  } | undefined;

  if (!user || !user.submitted_at) {
    return NextResponse.json({ error: "User not found or not submitted" }, { status: 404 });
  }

  const modules = db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];
  const caseStudies = db.prepare("SELECT * FROM case_studies ORDER BY module_id, sort_order").all() as CaseStudy[];
  const responses = db.prepare("SELECT case_study_id, content FROM responses WHERE user_id = ?").all(user.id) as { case_study_id: number; content: string }[];
  const recipients = db.prepare("SELECT email, name FROM notification_recipients").all() as { email: string; name: string }[];

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No notification recipients configured" }, { status: 400 });
  }

  const docxBuffer = await generateSubmissionDocx(
    { ...user, submitted_at: user.submitted_at },
    modules,
    caseStudies,
    responses
  );

  const sent = await sendSubmissionEmail({
    recipientEmails: recipients,
    userName: `${user.first_name} ${user.last_name}`,
    userEmail: user.email,
    cohort: user.cohort,
    submittedAt: user.submitted_at,
    docxBuffer,
  });

  if (!sent) {
    return NextResponse.json({ error: "Failed to send email. Check Postmark configuration." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
