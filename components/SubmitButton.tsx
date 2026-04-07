"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitButton({
  disabled = false,
  incomplete = false,
  remaining = 0,
}: {
  disabled?: boolean;
  incomplete?: boolean;
  remaining?: number;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/responses/submit", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={disabled}
        className="bg-bce-navy text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-bce-navy-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit All Responses
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-bce-navy mb-2">Confirm Submission</h3>
            {incomplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-900">
                <strong>{remaining}</strong> case {remaining === 1 ? "study is" : "studies are"} still unanswered. These will be recorded as blank in your submission.
              </div>
            )}
            <p className="text-sm text-bce-slate mb-6">
              Once submitted, your responses will be locked and cannot be edited. Are you sure you want to submit?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-bce-slate hover:text-bce-navy transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-bce-navy text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
