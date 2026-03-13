import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateSubmissionPdf } from "@/lib/pdf";
import { sendSubmissionEmail } from "@/lib/email";
import type { Module, CaseStudy } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId) as {
    id: number; first_name: string; last_name: string; email: string; cohort: string; submitted_at: string | null;
  } | undefined;

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.submitted_at) return NextResponse.json({ error: "Already submitted" }, { status: 400 });

  // Mark as submitted
  db.prepare("UPDATE users SET submitted_at = datetime('now') WHERE id = ?").run(session.userId);

  // Get the updated submitted_at timestamp
  const updatedUser = db.prepare("SELECT submitted_at FROM users WHERE id = ?").get(session.userId) as { submitted_at: string };

  // Generate PDF and send email in background (don't block the response)
  (async () => {
    try {
      const modules = db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];
      const caseStudies = db.prepare("SELECT * FROM case_studies ORDER BY module_id, sort_order").all() as CaseStudy[];
      const responses = db.prepare("SELECT case_study_id, content FROM responses WHERE user_id = ?").all(session.userId) as { case_study_id: number; content: string }[];
      const recipients = db.prepare("SELECT email, name FROM notification_recipients").all() as { email: string; name: string }[];

      const pdfBuffer = await generateSubmissionPdf(
        { ...user, submitted_at: updatedUser.submitted_at },
        modules,
        caseStudies,
        responses
      );

      await sendSubmissionEmail({
        recipientEmails: recipients,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
        cohort: user.cohort,
        submittedAt: updatedUser.submitted_at,
        pdfBuffer,
      });
    } catch (err) {
      console.error("Error generating/sending submission email:", err);
    }
  })();

  return NextResponse.json({ success: true });
}
