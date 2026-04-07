"use client";

import { useState } from "react";

export default function AdminUserActions({ userId }: { userId: number }) {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  return (
    <div className="flex items-center gap-2">
      {/* Download Word document */}
      <a
        href={`/api/admin/user-docx?userId=${userId}`}
        title="Download Word document"
        className="p-1.5 rounded-md text-bce-slate hover:text-bce-navy hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </a>

      {/* Resend email */}
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

      {/* Status message */}
      {message && (
        <span className={`text-xs font-medium ${message.type === "success" ? "text-bce-green" : "text-bce-red"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
