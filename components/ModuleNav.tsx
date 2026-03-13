"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Module } from "@/lib/types";

export default function ModuleNav({
  modules,
  moduleCaseMap,
}: {
  modules: Module[];
  moduleCaseMap: Record<number, number>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        <Link
          href="/dashboard"
          className={`px-4 py-2 rounded text-[15px] font-bold transition-colors ${
            pathname === "/dashboard"
              ? "bg-white/15 text-white"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          Home
        </Link>
        {modules.map((mod) => {
          const caseId = moduleCaseMap[mod.id];
          // Check if any case study in this module is currently active
          const isActive = pathname.includes(`/case-study/${caseId}`);
          const shortTitle = mod.title.replace("Module ", "M");
          return (
            <Link
              key={mod.id}
              href={caseId ? `/case-study/${caseId}` : "/dashboard"}
              className={`px-4 py-2 rounded text-[15px] font-bold transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {shortTitle}
            </Link>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/80 hover:text-white p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-[calc(5rem+3.25rem)] left-0 right-0 bg-bce-navy-dark border-t border-white/10 z-50 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded text-[15px] font-bold text-white hover:bg-white/10"
            >
              Home
            </Link>
            {modules.map((mod) => {
              const caseId = moduleCaseMap[mod.id];
              return (
                <Link
                  key={mod.id}
                  href={caseId ? `/case-study/${caseId}` : "/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded text-[15px] font-bold text-white/90 hover:text-white hover:bg-white/10"
                >
                  {mod.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
