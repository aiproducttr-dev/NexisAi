import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";

interface AppNavProps {
  backLink?: { href: string; label: string };
  right?: React.ReactNode;
  userLabel?: string;
}

export default function AppNav({ backLink, right, userLabel }: AppNavProps) {
  return (
    <nav className="lf-animate-in border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {backLink ? (
            <Link
              href={backLink.href}
              className="flex shrink-0 items-center gap-2 text-sm text-[#94a3b8] transition hover:text-[#e2e8f0]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLink.label}</span>
            </Link>
          ) : null}
          <BrandLogo href="/" size="md" />
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {userLabel ? (
            <span className="hidden max-w-[160px] truncate text-sm text-[#94a3b8] sm:inline lg:max-w-[220px]">
              {userLabel}
            </span>
          ) : null}
          {right}
        </div>
      </div>
    </nav>
  );
}
