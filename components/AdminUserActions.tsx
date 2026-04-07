"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConfirmAction = "reset" | "delete" | null;

export default function AdminUserActions({
  userId,
  userName,
  hasSubmitted,
}: {
  userId: number;
  userName: string;
  hasSubmitted: boolean;
}) {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [processing, setProcessing] = useState(false);

  async function handleResend() {
    setResending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Sent" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed" });
    }
    setResending(false);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setProcessing(true);
    setMessage(null);
    try {
      const endpoint = confirmAction === "reset" ? "/api/admin/reset-user" : "/api/admin/delete-user";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setMessage({
          type: "success",
          text: confirmAction === "reset" ? "Reset" : "Deleted",
        });
        setConfirmAction(null);
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed" });
    }
    setProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Download Word document — only if submitted */}
        {hasSubmitted && (
          <a
            href={`/api/admin/user-docx?userId=${userId}`}
            title="Download Word document"
            className="p-1.5 rounded-md text-bce-slate hover:text-bce-navy hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        )}

        {/* Resend email — only if submitted */}
        {hasSubmitted && (
          <button
            onClick={handleResend}
            disabled={resending}
            title="Resend email"
            className="p-1.5 rounded-md text-bce-slate hover:text-bce-navy hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {resending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}

        {/* Reset responses */}
        <button
          onClick={() => setConfirmAction("reset")}
          title="Reset — clear all responses"
          className="p-1.5 rounded-md text-bce-slate hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Delete participant */}
        <button
          onClick={() => setConfirmAction("delete")}
          title="Delete participant"
          className="p-1.5 rounded-md text-bce-slate hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Status message */}
        {message && (
          <span className={`text-xs font-medium ${message.type === "success" ? "text-bce-green" : "text-bce-red"}`}>
            {message.text}
          </span>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-bce-navy mb-2">
              {confirmAction === "reset" ? "Reset Participant?" : "Delete Participant?"}
            </h3>
            <div
              className={`border rounded-lg p-3 mb-4 text-sm ${
                confirmAction === "reset"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {confirmAction === "reset" ? (
                <>
                  This will permanently delete <strong>all responses</strong> for{" "}
                  <strong>{userName}</strong> and clear their submission. They will keep
                  their login and start again from scratch. This cannot be undone.
                </>
              ) : (
                <>
                  This will permanently delete <strong>{userName}</strong> along with all
                  their responses and submission. They will need to re-register. This
                  cannot be undone.
                </>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-bce-slate hover:text-bce-navy transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                  confirmAction === "reset"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing
                  ? "Working..."
                  : confirmAction === "reset"
                  ? "Yes, Reset"
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
