import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";
import ModuleNav from "@/components/ModuleNav";
import type { Module } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/");

  const db = getDb();
  const modules = db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];

  const moduleCaseMap: Record<number, number> = {};
  for (const mod of modules) {
    const first = db.prepare("SELECT id FROM case_studies WHERE module_id = ? ORDER BY sort_order LIMIT 1").get(mod.id) as { id: number } | undefined;
    if (first) moduleCaseMap[mod.id] = first.id;
  }

  return (
    <div>
      <div className="bg-bce-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <ModuleNav modules={modules} moduleCaseMap={moduleCaseMap} />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
