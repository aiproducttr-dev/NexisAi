"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminPanelLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin-panel/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[#94a3b8] transition hover:border-red-500/30 hover:text-red-300"
    >
      <LogOut className="h-4 w-4" />
      Çıkış
    </button>
  );
}
