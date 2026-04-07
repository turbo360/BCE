"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResponseEditor({
  caseStudyId,
  initialContent,
  nextQuestionHref,
  nextModuleHref,
  nextModuleTitle,
  showSubmit,
  allComplete,
}: {
  caseStudyId: number;
  initialContent: string;
  nextQuestionHref?: string;
  nextModuleHref?: string;
  nextModuleTitle?: string;
  showSubmit?: boolean;
  allComplete?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(async (text: string, showModal = false) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/responses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseStudyId, content: text }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        if (showModal) {
          setShowSaveModal(true);
          setTimeout(() => setShowSaveModal(false), 2000);
        }
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [caseStudyId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus("idle");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(newContent), 1500);
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(300, textareaRef.current.scrollHeight) + "px";
    }
  }, [content]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-bce-slate">
          Write your response below. Your work is auto-saved as you type.
        </p>
        <span className={`text-xs font-medium ${
          saveStatus === "saving" ? "text-amber-500" :
          saveStatus === "saved" ? "text-bce-green" :
          saveStatus === "error" ? "text-bce-red" :
          "text-gray-400"
        }`}>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Save failed"}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        data-response-editor
        value={content}
        onChange={handleChange}
        placeholder="Type your response here..."
        className="w-full min-h-[300px] p-4 border border-gray-200 rounded-lg text-sm text-bce-slate leading-relaxed focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none resize-y"
      />
      <div className="flex justify-end gap-3 mt-3">
        <button
          onClick={() => save(content, true)}
          className="bg-bce-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy-dark transition-colors"
        >
          Save Response
        </button>
        {nextQuestionHref && (
          <button
            onClick={async () => {
              await save(content);
              router.push(nextQuestionHref);
            }}
            className="bg-bce-light-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy transition-colors flex items-center gap-2"
          >
            Next Question
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!nextQuestionHref && nextModuleHref && (
          <button
            onClick={async () => {
              await save(content);
              router.push(nextModuleHref);
            }}
            className="bg-bce-light-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy transition-colors flex items-center gap-2"
          >
            Next Module{nextModuleTitle ? `: ${nextModuleTitle}` : ""}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {showSubmit && (
          <button
            onClick={async () => {
              await save(content);
              setShowSubmitConfirm(true);
            }}
            className="bg-bce-green text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
          >
            Submit All Responses
          </button>
        )}
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-bce-navy mb-2">Confirm Submission</h3>
            {allComplete === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-900">
                Some case studies are still unanswered. They will be recorded as blank in your submission.
              </div>
            )}
            <p className="text-sm text-bce-slate mb-6">
              Once submitted, your responses will be locked and cannot be edited. Are you sure you want to submit?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-bce-slate hover:text-bce-navy transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/responses/submit", { method: "POST" });
                    if (res.ok) {
                      router.push("/dashboard");
                      router.refresh();
                    }
                  } finally {
                    setSubmitting(false);
                    setShowSubmitConfirm(false);
                  }
                }}
                disabled={submitting}
                className="bg-bce-green text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save confirmation modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center animate-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-bce-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-bce-navy-dark mb-1">Response Saved</h3>
            <p className="text-sm text-bce-slate">Your response has been saved successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}
