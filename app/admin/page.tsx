import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import AdminPinGate from "@/components/AdminPinGate";
import RecipientManager from "@/components/RecipientManager";
import AdminUserActions from "@/components/AdminUserActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return <AdminPinGate />;
  }

  const db = getDb();
  const totalCases = (db.prepare("SELECT COUNT(*) as count FROM case_studies").get() as { count: number }).count;

  const users = db.prepare(`
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.cohort, u.submitted_at, u.created_at,
      COUNT(r.id) as response_count,
      SUM(CASE WHEN r.content IS NOT NULL AND r.content != '' THEN 1 ELSE 0 END) as completed_count
    FROM users u
    LEFT JOIN responses r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as {
    id: number; first_name: string; last_name: string; email: string; cohort: string; submitted_at: string | null; created_at: string;
    response_count: number; completed_count: number;
  }[];

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-bce-navy">Admin Dashboard</h1>
            <p className="text-sm text-bce-slate mt-1">{users.length} registered participants</p>
          </div>
          <Link href="/dashboard" className="text-sm text-bce-light-blue hover:text-bce-navy font-medium">
            Back to Portal
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-bce-navy">{users.length}</div>
            <div className="text-sm text-bce-slate">Total Participants</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.submitted_at).length}
            </div>
            <div className="text-sm text-bce-slate">Submitted</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-amber-600">
              {users.filter((u) => !u.submitted_at).length}
            </div>
            <div className="text-sm text-bce-slate">In Progress</div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bce-navy text-white text-left text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Participant</th>
                  <th className="px-6 py-3 font-semibold">Cohort</th>
                  <th className="px-6 py-3 font-semibold">Progress</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Registered</th>
                  <th className="px-6 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-bce-cream/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-bce-navy">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-bce-slate">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-bce-slate">{u.cohort}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-bce-light-blue rounded-full h-2 transition-all"
                            style={{ width: `${totalCases > 0 ? (u.completed_count / totalCases) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-bce-slate">{u.completed_count}/{totalCases}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.submitted_at ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Submitted
                        </span>
                      ) : u.completed_count > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Not Started
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-bce-slate">
                      {new Date(u.created_at + "Z").toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/user/${u.id}`}
                          className="text-sm text-bce-light-blue hover:text-bce-navy font-medium"
                        >
                          View
                        </Link>
                        {u.submitted_at && <AdminUserActions userId={u.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-bce-slate">
                      No participants have registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Recipients */}
        <div className="mt-8">
          <RecipientManager />
        </div>
      </div>
    </div>
  );
}
