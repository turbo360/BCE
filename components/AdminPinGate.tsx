"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPinGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-bce-navy text-center mb-2">Admin Access</h2>
        <p className="text-sm text-bce-slate text-center mb-6">Enter PIN to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            maxLength={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-bce-gold focus:border-transparent outline-none"
            autoFocus
          />
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-bce-navy text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-bce-navy-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
