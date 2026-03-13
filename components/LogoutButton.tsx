"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs bg-gray-100 text-bce-slate hover:bg-gray-200 hover:text-bce-navy-dark px-3 py-1.5 rounded-md font-semibold transition-colors"
    >
      Sign Out
    </button>
  );
}
