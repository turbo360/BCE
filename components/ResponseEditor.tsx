"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export default function ResponseEditor({
  caseStudyId,
  initialContent,
}: {
  caseStudyId: number;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(async (text: string) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/responses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseStudyId, content: text }),
      });
      if (res.ok) {
        setSaveStatus("saved");
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
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${
            saveStatus === "saving" ? "text-amber-500" :
            saveStatus === "saved" ? "text-green-600" :
            saveStatus === "error" ? "text-red-500" :
            "text-gray-400"
          }`}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save failed"}
            {saveStatus === "idle" && ""}
          </span>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Type your response here..."
        className="w-full min-h-[300px] p-4 border border-gray-200 rounded-lg text-sm text-bce-slate leading-relaxed focus:ring-2 focus:ring-bce-gold focus:border-transparent outline-none resize-y"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={() => save(content)}
          className="bg-bce-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy-dark transition-colors"
        >
          Save Response
        </button>
      </div>
    </div>
  );
}
