import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { generateSubmissionPdf } from "@/lib/pdf";
import type { Module, CaseStudy } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
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

  const pdfBuffer = await generateSubmissionPdf(
    { ...user, submitted_at: user.submitted_at },
    modules,
    caseStudies,
    responses
  );

  const fileName = `BCE-Responses-${user.first_name}-${user.last_name}.pdf`.replace(/\s+/g, "-");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
