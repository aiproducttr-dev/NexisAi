import Link from "next/link";
import Image from "next/image";
import { getAppBaseUrl } from "@/lib/constants/urls";
import { MessageSquare, LogOut } from "lucide-react";

export default function ForumNav({
  userLabel,
  isLoggedIn,
}: {
  userLabel?: string | null;
  isLoggedIn?: boolean;
}) {
  const appUrl = getAppBaseUrl();

  return (
    <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/forum" className="flex items-center gap-3">
          <Image
            src="/favicon.svg"
            alt="NexisAI Form"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <span className="lf-orbitron text-lg font-bold tracking-wide text-white">
              NEXIS<span className="text-cyan-400">FORM</span>
            </span>
            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-[#64748b] sm:block">
              Yapay Zeka Görünürlük Forumu
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {userLabel && (
            <span className="hidden text-sm text-[#94a3b8] sm:inline">
              {userLabel}
            </span>
          )}
          <Link
            href={`${appUrl}/dashboard`}
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#94a3b8] transition hover:border-violet-500/30 hover:text-white sm:flex"
          >
            NexisAI Panel
          </Link>
          {isLoggedIn ? (
            <Link
              href={`${appUrl}/dashboard`}
              className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
          ) : (
            <Link
              href="/auth?redirect=/forum"
              className="lf-btn-primary relative flex min-h-[40px] items-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-semibold text-white"
            >
              <MessageSquare className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
