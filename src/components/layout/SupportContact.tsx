import { ArrowUpRight, Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants/urls";

export default function SupportContact({
  className = "",
  align = "center",
}: {
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`${align === "center" ? "flex justify-center" : ""} ${className}`}
    >
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="group flex w-full max-w-md items-center gap-3.5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-cyan-500/[0.03] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500/35 hover:bg-cyan-500/[0.06] hover:shadow-[0_8px_32px_rgba(6,182,212,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] sm:gap-4 sm:px-5 sm:py-4"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/10 shadow-[0_0_20px_rgba(6,182,212,0.18)] transition group-hover:shadow-[0_0_28px_rgba(6,182,212,0.28)]"
          aria-hidden
        >
          <Mail className="h-5 w-5 text-cyan-400" />
        </span>

        <span className="min-w-0 flex-1 text-left">
          <span className="lf-orbitron block text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
            Müşteri Desteği
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-white transition group-hover:text-cyan-300 sm:text-base">
            {SUPPORT_EMAIL}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-[#64748b]">
            Kampanya, ödeme ve teknik konularda yardım
          </span>
        </span>

        <ArrowUpRight
          className="hidden h-4 w-4 shrink-0 text-[#64748b] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-400 sm:block"
          aria-hidden
        />
      </a>
    </div>
  );
}
