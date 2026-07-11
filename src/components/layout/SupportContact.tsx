import { ArrowUpRight, Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants/urls";

export default function SupportContact({
  className = "",
  variant = "default",
  belowNav = false,
}: {
  className?: string;
  variant?: "default" | "topRight";
  /** Place below AppNav so it does not cover logout / nav actions */
  belowNav?: boolean;
}) {
  const isTopRight = variant === "topRight";

  const card = (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a12]/95 to-cyan-500/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500/35 hover:shadow-[0_8px_32px_rgba(6,182,212,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] ${
        isTopRight
          ? "w-full max-w-[20rem] gap-2.5 px-3 py-2.5 sm:max-w-[22rem] sm:px-4 sm:py-3"
          : "w-full max-w-md gap-3.5 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
      } ${className}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/10 shadow-[0_0_20px_rgba(6,182,212,0.18)] transition group-hover:shadow-[0_0_28px_rgba(6,182,212,0.28)] ${
          isTopRight ? "h-9 w-9" : "h-11 w-11"
        }`}
        aria-hidden
      >
        <Mail className={`text-cyan-400 ${isTopRight ? "h-4 w-4" : "h-5 w-5"}`} />
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="lf-orbitron block text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
          Müşteri Desteği
        </span>
        <span
          className={`mt-0.5 block truncate font-semibold text-white transition group-hover:text-cyan-300 ${
            isTopRight ? "text-xs sm:text-sm" : "mt-1 text-sm sm:text-base"
          }`}
        >
          {SUPPORT_EMAIL}
        </span>
        <span
          className={`block leading-relaxed text-[#64748b] ${
            isTopRight
              ? "mt-0.5 hidden text-[10px] sm:block sm:text-xs"
              : "mt-0.5 text-xs"
          }`}
        >
          Kampanya, ödeme ve teknik konularda yardım
        </span>
      </span>

      <ArrowUpRight
        className={`hidden shrink-0 text-[#64748b] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-400 sm:block ${
          isTopRight ? "h-3.5 w-3.5" : "h-4 w-4"
        }`}
        aria-hidden
      />
    </a>
  );

  if (isTopRight) {
    return (
      <div
        className={`pointer-events-none fixed right-3 z-50 w-[min(100vw-1.5rem,22rem)] sm:right-5 ${
          belowNav ? "top-[4.75rem] sm:top-[5.25rem]" : "top-3 sm:top-5"
        }`}
      >
        <div className="pointer-events-auto">{card}</div>
      </div>
    );
  }

  return <div className={`flex justify-center ${className}`}>{card}</div>;
}
