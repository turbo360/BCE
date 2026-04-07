import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Module, CaseStudy, Response, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) redirect("/admin");

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(params.id) as User | undefined;
  if (!user) notFound();

  const allModules = db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];
  const allCases = db.prepare("SELECT * FROM case_studies ORDER BY module_id, sort_order").all() as CaseStudy[];
  const userResponses = db.prepare("SELECT * FROM responses WHERE user_id = ?").all(user.id) as Response[];

  const responseMap = new Map(userResponses.map((r) => [r.case_study_id, r]));

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/admin" className="text-bce-light-blue hover:text-bce-navy font-medium">
            Admin
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-bce-navy font-medium">{user.email}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-bce-slate uppercase tracking-wider mb-1">Email</div>
              <div className="text-sm font-medium text-bce-navy">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-bce-slate uppercase tracking-wider mb-1">Syndicate #</div>
              <div className="text-sm font-medium text-bce-navy">{user.cohort}</div>
            </div>
            <div>
              <div className="text-xs text-bce-slate uppercase tracking-wider mb-1">Registered</div>
              <div className="text-sm font-medium text-bce-navy">
                {new Date(user.created_at + "Z").toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane" })}
              </div>
            </div>
            <div>
              <div className="text-xs text-bce-slate uppercase tracking-wider mb-1">Status</div>
              {user.submitted_at ? (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                  Submitted {new Date(user.submitted_at + "Z").toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane" })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Responses by module */}
        <div className="space-y-6">
          {allModules.map((mod) => {
            const moduleCases = allCases.filter((c) => c.module_id === mod.id);
            return (
              <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-bce-navy px-6 py-4">
                  <h2 className="text-white font-bold">{mod.title}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {moduleCases.map((cs) => {
                    const response = responseMap.get(cs.id);
                    const hasContent = response?.content && response.content.trim().length > 0;
                    return (
                      <div key={cs.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-sm font-bold text-bce-navy">{cs.title}</h3>
                          {hasContent ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">
                              No Response
                            </span>
                          )}
                        </div>
                        {hasContent ? (
                          <div className="bg-gray-50 rounded-lg p-4 text-sm text-bce-slate leading-relaxed whitespace-pre-wrap">
                            {response!.content}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No response submitted.</p>
                        )}
                        {response?.updated_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last updated: {new Date(response.updated_at + "Z").toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
