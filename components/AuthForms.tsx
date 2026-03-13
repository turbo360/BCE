"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { firstName, lastName, email, cohort } : { email };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "register"
                ? "text-bce-navy-dark border-b-2 border-bce-navy bg-white"
                : "text-gray-400 hover:text-gray-600 bg-gray-50"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "text-bce-navy-dark border-b-2 border-bce-navy bg-white"
                : "text-gray-400 hover:text-gray-600 bg-gray-50"
            }`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-bce-navy-dark mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-bce-navy-dark mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bce-navy-dark mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@bce.edu.au"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none text-sm"
            />
          </div>

          {mode === "register" && (
            <div>
              <label htmlFor="cohort" className="block text-sm font-medium text-bce-navy-dark mb-1">
                Cohort Name
              </label>
              <input
                id="cohort"
                type="text"
                required
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="e.g. Cohort 1 - March 2025"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none text-sm"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bce-navy text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-bce-navy-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            {mode === "register"
              ? "Already have an account? Use the Sign In tab above."
              : "New participant? Use the Register tab above."}
          </p>
        </form>
      </div>
    </div>
  );
}
