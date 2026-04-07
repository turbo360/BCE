import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import type { Module, CaseStudy, Response } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSessionUser();
  if (!session) redirect("/");

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId) as {
    id: number; first_name: string; last_name: string; email: string; cohort: string; submitted_at: string | null; created_at: string;
  } | undefined;
  if (!user) redirect("/");
  const allModules = db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];
  const allCases = db.prepare("SELECT * FROM case_studies ORDER BY module_id, sort_order").all() as CaseStudy[];
  const userResponses = db.prepare("SELECT case_study_id, content FROM responses WHERE user_id = ?").all(session.userId) as Pick<Response, "case_study_id" | "content">[];

  const responseMap = new Map(userResponses.map((r) => [r.case_study_id, r.content]));
  const totalCases = allCases.length;
  const completedCases = userResponses.filter((r) => r.content && r.content.trim().length > 0).length;
  const allComplete = completedCases === totalCases;

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)]">
      {/* Dashboard header with gradient */}
      <div className="bg-gradient-to-r from-bce-navy-dark via-bce-navy to-bce-light-blue">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Case Studies Dashboard</h1>
              <p className="text-sm text-white/70 mt-1">
                {user.first_name} {user.last_name} &middot; Syndicate #{user.cohort}
              </p>
              <p className="text-xs text-white/50 mt-1">
                Modules 2–6 <span className="italic">(there are no case studies for Module 1)</span>
              </p>
            </div>
            {user.submitted_at && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 bg-bce-green rounded-full"></span>
                Submitted
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Progress bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-bce-navy-dark">Overall Progress</span>
            <span className="text-sm text-bce-slate">{completedCases} of {totalCases} case studies</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-bce-light-blue rounded-full h-3 transition-all duration-500"
              style={{ width: `${totalCases > 0 ? (completedCases / totalCases) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          {allModules.map((mod) => {
            const moduleCases = allCases.filter((c) => c.module_id === mod.id);
            const moduleCompleted = moduleCases.filter(
              (c) => {
                const content = responseMap.get(c.id);
                return content && content.trim().length > 0;
              }
            ).length;
            const moduleTotal = moduleCases.length;

            return (
              <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-bce-navy">{mod.title}</h2>
                      <p className="text-sm text-bce-slate mt-1 leading-relaxed max-w-3xl">{mod.description}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        moduleCompleted === moduleTotal
                          ? "bg-green-100 text-green-800"
                          : moduleCompleted > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {moduleCompleted}/{moduleTotal}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {moduleCases.map((cs, idx) => {
                    const content = responseMap.get(cs.id);
                    const hasResponse = content != null && content.trim().length > 0;
                    return (
                      <Link
                        key={cs.id}
                        href={`/case-study/${cs.id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-bce-cream/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            hasResponse
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          }`}>
                            {hasResponse ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className="text-sm font-medium text-bce-navy group-hover:text-bce-light-blue">
                            {cs.title}
                          </span>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-300 group-hover:text-bce-light-blue transition-colors"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit section */}
        {!user.submitted_at && (
          <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <h3 className="text-lg font-bold text-bce-navy-dark mb-2">Ready to Submit?</h3>
            <p className="text-sm text-bce-slate mb-4">
              {allComplete
                ? "All case studies are complete. You can now submit your responses."
                : `You have completed ${completedCases} of ${totalCases} case studies. You can submit now — unanswered case studies will be recorded as blank.`}
            </p>
            <SubmitButton disabled={false} incomplete={!allComplete} remaining={totalCases - completedCases} />
          </div>
        )}
      </div>
    </div>
  );
}
