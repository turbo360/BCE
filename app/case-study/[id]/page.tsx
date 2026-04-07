import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ResponseEditor from "@/components/ResponseEditor";
import CaseStudyBottomNav from "@/components/CaseStudyBottomNav";
import type { CaseStudy, Module, Response } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CaseStudyPage({ params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/");

  const db = getDb();
  const caseStudy = db.prepare("SELECT * FROM case_studies WHERE id = ?").get(params.id) as CaseStudy | undefined;
  if (!caseStudy) notFound();

  const mod = db.prepare("SELECT * FROM modules WHERE id = ?").get(caseStudy.module_id) as Module;
  const user = db.prepare("SELECT submitted_at FROM users WHERE id = ?").get(session.userId) as { submitted_at: string | null };
  const existingResponse = db.prepare("SELECT content FROM responses WHERE user_id = ? AND case_study_id = ?").get(session.userId, caseStudy.id) as Pick<Response, "content"> | undefined;

  const moduleCases = db.prepare("SELECT id, title, sort_order FROM case_studies WHERE module_id = ? ORDER BY sort_order").all(caseStudy.module_id) as Pick<CaseStudy, "id" | "title" | "sort_order">[];
  const allCases = db.prepare("SELECT id FROM case_studies ORDER BY module_id, sort_order").all() as Pick<CaseStudy, "id">[];
  const currentIndex = allCases.findIndex((c) => c.id === caseStudy.id);
  const prevCase = currentIndex > 0 ? allCases[currentIndex - 1] : null;
  const nextCase = currentIndex < allCases.length - 1 ? allCases[currentIndex + 1] : null;

  // If scenario references Question 1, fetch the full scenario from the first case in this module
  const isReferenceScenario = caseStudy.scenario.toLowerCase().includes("refer to the scenario");
  let displayScenario = caseStudy.scenario;
  if (isReferenceScenario) {
    const firstCase = db.prepare("SELECT scenario FROM case_studies WHERE module_id = ? ORDER BY sort_order LIMIT 1").get(caseStudy.module_id) as { scenario: string } | undefined;
    if (firstCase) displayScenario = firstCase.scenario;
  }

  // Find next question in same module for "Next Question" button
  const currentModuleIndex = moduleCases.findIndex((mc) => mc.id === caseStudy.id);
  const nextModuleCase = currentModuleIndex < moduleCases.length - 1 ? moduleCases[currentModuleIndex + 1] : null;

  // Find first case study of next module for "Next Module" button
  let nextModuleFirstCase: { id: number } | null = null;
  let nextModuleTitle: string | null = null;
  if (!nextModuleCase) {
    const nextMod = db.prepare("SELECT * FROM modules WHERE id > ? ORDER BY id LIMIT 1").get(caseStudy.module_id) as Module | undefined;
    if (nextMod) {
      const firstCase = db.prepare("SELECT id FROM case_studies WHERE module_id = ? ORDER BY sort_order LIMIT 1").get(nextMod.id) as { id: number } | undefined;
      if (firstCase) {
        nextModuleFirstCase = firstCase;
        nextModuleTitle = nextMod.title.replace("Module ", "M");
      }
    }
  }

  // Check if this is the very last case study (end of M6) and if all responses are complete
  const isLastCaseStudy = !nextModuleCase && !nextModuleFirstCase;
  let allComplete = false;
  if (isLastCaseStudy) {
    const totalCases = allCases.length;
    const completedCount = (db.prepare("SELECT COUNT(*) as count FROM responses WHERE user_id = ? AND content != '' AND content IS NOT NULL").get(session.userId) as { count: number }).count;
    allComplete = completedCount >= totalCases;
  }

  const isSubmitted = !!user.submitted_at;

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/dashboard" className="text-bce-light-blue hover:text-bce-navy font-medium">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-bce-slate">{mod.title}</span>
          <span className="text-gray-300">/</span>
          <span className="text-bce-navy-dark font-semibold">{caseStudy.title}</span>
        </div>

        {/* Module case study nav pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {moduleCases.map((mc) => (
            <Link
              key={mc.id}
              href={`/case-study/${mc.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                mc.id === caseStudy.id
                  ? "bg-bce-navy text-white"
                  : "bg-white text-bce-slate hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {mc.title}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scenario panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-bce-navy-dark px-6 py-4">
              <h1 className="text-white font-bold text-lg">{caseStudy.title}</h1>
              <p className="text-bce-light-blue text-xs mt-0.5">{mod.title}</p>
            </div>
            <div className="p-6">
              <h3 className="text-xs font-bold text-bce-navy uppercase tracking-wider mb-4">Scenario</h3>
              <div
                className="text-base text-bce-slate leading-relaxed scenario-content"
                dangerouslySetInnerHTML={{ __html: displayScenario }}
              />
            </div>
          </div>

          {/* Questions + Response panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-bce-navy px-6 py-4">
              <h2 className="text-white font-bold text-sm">Question & Response</h2>
            </div>
            <div className="p-6">
              {/* Question displayed above the response area */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xs font-bold text-bce-navy uppercase tracking-wider mb-3">Question</h3>
                <div
                  className="text-[15px] text-bce-navy-dark font-medium leading-relaxed scenario-content"
                  dangerouslySetInnerHTML={{ __html: caseStudy.questions }}
                />
              </div>

              {/* Response area */}
              {isSubmitted ? (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                    <p className="text-green-800 text-sm font-medium">
                      Your responses have been submitted and are now locked.
                    </p>
                  </div>
                  <div
                    className="prose-response text-[15px] text-bce-slate whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: existingResponse?.content || "<p>No response provided.</p>" }}
                  />
                </div>
              ) : (
                <ResponseEditor
                  caseStudyId={caseStudy.id}
                  initialContent={existingResponse?.content || ""}
                  nextQuestionHref={nextModuleCase ? `/case-study/${nextModuleCase.id}` : undefined}
                  nextModuleHref={nextModuleFirstCase ? `/case-study/${nextModuleFirstCase.id}` : undefined}
                  nextModuleTitle={nextModuleTitle || undefined}
                  showSubmit={isLastCaseStudy}
                  allComplete={allComplete}
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <CaseStudyBottomNav
          caseStudyId={caseStudy.id}
          prevHref={prevCase ? `/case-study/${prevCase.id}` : null}
          nextHref={nextCase ? `/case-study/${nextCase.id}` : null}
          isSubmitted={isSubmitted}
        />
      </div>
    </div>
  );
}
