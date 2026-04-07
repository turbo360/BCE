"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CaseStudyBottomNav({
  caseStudyId,
  prevHref,
  nextHref,
  isSubmitted,
}: {
  caseStudyId: number;
  prevHref: string | null;
  nextHref: string | null;
  isSubmitted: boolean;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  async function saveBeforeNavigate(href: string) {
    if (navigating) return;
    setNavigating(true);
    if (!isSubmitted) {
      const textarea = document.querySelector<HTMLTextAreaElement>("[data-response-editor]");
      if (textarea) {
        try {
          await fetch("/api/responses", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caseStudyId, content: textarea.value }),
          });
        } catch {
          // Allow navigation even if save fails — avoids trapping the user
        }
      }
    }
    router.push(href);
  }

  return (
    <div className="flex items-center justify-between mt-8">
      {prevHref ? (
        <button
          onClick={() => saveBeforeNavigate(prevHref)}
          disabled={navigating}
          className="flex items-center gap-2 text-sm font-semibold text-bce-navy hover:text-bce-light-blue transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
      ) : (
        <div />
      )}
      <Link
        href="/dashboard"
        className="text-sm font-medium text-bce-slate hover:text-bce-navy transition-colors"
      >
        Back to Dashboard
      </Link>
      {nextHref ? (
        <button
          onClick={() => saveBeforeNavigate(nextHref)}
          disabled={navigating}
          className="flex items-center gap-2 text-sm font-semibold text-bce-navy hover:text-bce-light-blue transition-colors disabled:opacity-50"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
