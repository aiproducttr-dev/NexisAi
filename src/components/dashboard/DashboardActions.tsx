"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, LogOut } from "lucide-react";

export default function DashboardActions() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const onNewPage = pathname === "/dashboard/new";
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setLoggedIn(!!data.user);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loggedIn === false) {
    const authRedirect = onNewPage ? "/dashboard/new" : "/dashboard";
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/auth?mode=login&redirect=${encodeURIComponent(authRedirect)}`}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-[#e2e8f0]"
        >
          Giriş Yap
        </Link>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-[#e2e8f0] transition hover:border-violet-500"
        >
          Kampanya Başlat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {onNewPage ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:border-cyan-500"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Kampanyalarım
        </Link>
      ) : (
        <Link
          href="/dashboard/new"
          className="hidden rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-[#e2e8f0] shadow-[0_0_16px_rgba(139,92,246,0.12)] transition hover:border-violet-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] sm:inline-flex"
        >
          Yeni Kampanya
        </Link>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-[#e2e8f0]"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Çıkış</span>
      </button>
    </div>
  );
}
