"use client";

import { useState, useEffect } from "react";

interface Recipient {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export default function RecipientManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/recipients");
    if (res.ok) {
      const data = await res.json();
      setRecipients(data.recipients);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;

    const res = await fetch("/api/admin/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() }),
    });

    if (res.ok) {
      setEmail("");
      setName("");
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add recipient");
    }
  }

  async function handleRemove(id: number) {
    await fetch("/api/admin/recipients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-bce-navy px-6 py-4">
        <h2 className="text-white font-bold text-sm">Submission Notification Recipients</h2>
        <p className="text-bce-light-blue text-xs mt-0.5">
          These email addresses receive a notification with PDF attachment when a participant submits.
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none sm:w-40"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-bce-light-blue focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="bg-bce-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-bce-navy-dark transition-colors whitespace-nowrap"
          >
            Add Recipient
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-bce-slate">Loading...</p>
        ) : recipients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-bce-slate">No recipients configured.</p>
            <p className="text-xs text-gray-400 mt-1">Add an email address above to receive submission notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm font-medium text-bce-navy">{r.name || r.email}</span>
                  {r.name && <span className="text-sm text-bce-slate ml-2">{r.email}</span>}
                </div>
                <button
                  onClick={() => handleRemove(r.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
