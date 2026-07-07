import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { getAppBaseUrl } from "@/lib/constants/urls";
import { LogOut, MessageSquare, PlusCircle } from "lucide-react";

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
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div aria-hidden className="min-w-0" />

        <BrandLogo
          href="/forum"
          size="xl"
          centered
          suffix={
            <span className="lf-orbitron text-sm font-bold tracking-wide text-cyan-400 sm:text-base">
              FORM
            </span>
          }
        />

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-2 sm:gap-3">
          {userLabel && (
            <span className="hidden text-sm text-[#94a3b8] md:inline">
              {userLabel}
            </span>
          )}
          <Link
            href={isLoggedIn ? "/forum/new" : "/auth?mode=register&redirect=/forum/new"}
            className="hidden items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-500/40 hover:text-cyan-200 lg:flex"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden xl:inline">Soru sor</span>
          </Link>
          <Link
            href={`${appUrl}/dashboard`}
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#94a3b8] transition hover:border-violet-500/30 hover:text-white lg:flex"
          >
            <span className="hidden xl:inline">NexisAI Panel</span>
            <span className="xl:hidden">Panel</span>
          </Link>
          {isLoggedIn ? (
            <Link
              href={`${appUrl}/dashboard`}
              className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-white sm:px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
          ) : (
            <Link
              href="/auth?redirect=/forum"
              className="lf-btn-primary relative flex min-h-[40px] items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm font-semibold text-white sm:px-4"
            >
              <MessageSquare className="relative z-10 h-4 w-4" />
              <span className="relative z-10 hidden sm:inline">Giriş</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
