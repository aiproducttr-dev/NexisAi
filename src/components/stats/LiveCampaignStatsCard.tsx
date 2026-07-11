"use client";

import { useEffect, useState } from "react";
import {
  CAMPAIGN_LEADERS,
  getActiveCampaignCount,
  getNextActiveCampaignIncrementAt,
  type CampaignLeader,
  type LiveCampaignStats,
} from "@/lib/stats/live-campaign-stats";
import { Trophy } from "lucide-react";

interface LiveCampaignStatsCardProps {
  initialStats?: LiveCampaignStats | null;
  className?: string;
  compact?: boolean;
}

export default function LiveCampaignStatsCard({
  initialStats = null,
  className = "",
  compact = false,
}: LiveCampaignStatsCardProps) {
  const [activeCampaigns, setActiveCampaigns] = useState(
    initialStats?.activeCampaigns ?? getActiveCampaignCount(),
  );
  const [leaders] = useState<CampaignLeader[]>(
    initialStats?.leaders?.length ? initialStats.leaders : CAMPAIGN_LEADERS,
  );

  useEffect(() => {
    if (!initialStats) return;
    setActiveCampaigns(initialStats.activeCampaigns);
  }, [initialStats]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const syncCount = () => {
      if (cancelled) return;
      const now = Date.now();
      setActiveCampaigns(getActiveCampaignCount(now));
      const delay = Math.max(
        1000,
        getNextActiveCampaignIncrementAt(now) - now + 50,
      );
      timer = setTimeout(syncCount, delay);
    };

    syncCount();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            Aktif Kampanyalar
          </p>
          <p
            className={`lf-orbitron font-bold text-white ${
              compact ? "text-xl" : "text-2xl"
            }`}
          >
            {activeCampaigns.toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
            Kampanya Liderleri
          </p>
        </div>
        <div className="mb-2 grid grid-cols-[1.4rem_1fr] gap-x-2 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">
          <span />
          <span className="grid grid-cols-3 gap-1">
            <span>Şehir</span>
            <span>Kategori</span>
            <span>İşletme</span>
          </span>
        </div>
        <ol className="space-y-2">
          {leaders.map((leader) => (
            <li
              key={`${leader.rank}-${leader.businessName}`}
              className="grid grid-cols-[1.4rem_1fr] items-start gap-x-2 text-sm"
            >
              <span className="lf-orbitron pt-0.5 text-xs font-bold text-amber-400">
                {leader.rank}.
              </span>
              <span className="grid min-w-0 grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-1">
                <span className="truncate font-medium text-[#e2e8f0]">
                  <span className="mr-1 text-[10px] text-[#64748b] sm:hidden">
                    Şehir:
                  </span>
                  {leader.city}
                </span>
                <span className="truncate text-[#94a3b8]">
                  <span className="mr-1 text-[10px] text-[#64748b] sm:hidden">
                    Kategori:
                  </span>
                  {leader.category}
                </span>
                <span className="truncate font-semibold text-white">
                  <span className="mr-1 text-[10px] text-[#64748b] sm:hidden">
                    İşletme:
                  </span>
                  {leader.businessName}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
