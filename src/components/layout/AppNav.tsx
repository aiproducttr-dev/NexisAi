import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";

interface AppNavProps {
  backLink?: { href: string; label: string };
  logoHref?: string;
  right?: React.ReactNode;
  userLabel?: string;
}

export default function AppNav({
  backLink,
  logoHref = "/",
  right,
  userLabel,
}: AppNavProps) {
  return (
    <nav className="lf-animate-in border-b border-white/5">
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 justify-self-start">
          {backLink ? (
            <Link
              href={backLink.href}
              className="flex items-center gap-2 text-sm text-[#94a3b8] transition hover:text-[#e2e8f0]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{backLink.label}</span>
            </Link>
          ) : null}
        </div>

        <BrandLogo href={logoHref} size="xl" centered />

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-2 sm:gap-3">
          {userLabel ? (
            <span className="hidden max-w-[120px] truncate text-sm text-[#94a3b8] sm:inline lg:max-w-[180px]">
              {userLabel}
            </span>
          ) : null}
          {right}
        </div>
      </div>
    </nav>
  );
}
