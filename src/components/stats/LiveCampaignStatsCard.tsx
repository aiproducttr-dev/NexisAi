"use client";

import { useEffect, useState } from "react";
import {
  getActiveCampaignCount,
  getNextActiveCampaignIncrementAt,
  type CategoryLeader,
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
  const [leaders, setLeaders] = useState<CategoryLeader[]>(
    initialStats?.leaders ?? [],
  );
  const [nextIncrementAt, setNextIncrementAt] = useState(
    initialStats?.nextIncrementAt ?? getNextActiveCampaignIncrementAt(),
  );
  const [leadersNextChangeAt, setLeadersNextChangeAt] = useState(
    initialStats?.leadersNextChangeAt ?? Date.now() + 60_000,
  );
  const [loaded, setLoaded] = useState(Boolean(initialStats?.leaders.length));

  useEffect(() => {
    if (!initialStats) return;
    setActiveCampaigns(initialStats.activeCampaigns);
    setLeaders(initialStats.leaders);
    setNextIncrementAt(initialStats.nextIncrementAt);
    setLeadersNextChangeAt(initialStats.leadersNextChangeAt);
    setLoaded(true);
  }, [initialStats]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/stats/live", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as LiveCampaignStats;
        if (cancelled) return;
        setActiveCampaigns(data.activeCampaigns);
        setLeaders(data.leaders);
        setNextIncrementAt(data.nextIncrementAt);
        setLeadersNextChangeAt(data.leadersNextChangeAt);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };

    if (!initialStats) {
      void load();
    }
  }, [initialStats]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const syncCount = () => {
      if (cancelled) return;
      const now = Date.now();
      setActiveCampaigns(getActiveCampaignCount(now));
      setNextIncrementAt(getNextActiveCampaignIncrementAt(now));
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

  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshLeaders = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/stats/live", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as LiveCampaignStats;
        if (cancelled) return;
        setLeaders(data.leaders);
        setLeadersNextChangeAt(data.leadersNextChangeAt);
        setActiveCampaigns(data.activeCampaigns);
        setNextIncrementAt(data.nextIncrementAt);
      } catch {
        // keep current
      }
    };

    const schedule = () => {
      if (cancelled) return;
      const delay = Math.max(5000, leadersNextChangeAt - Date.now() + 200);
      timer = setTimeout(async () => {
        await refreshLeaders();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [leadersNextChangeAt, loaded]);

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
            Kampanya Lideri Kategorileri
          </p>
        </div>
        {leaders.length > 0 ? (
          <ol className="space-y-1.5">
            {leaders.map((leader) => (
              <li
                key={`${leader.rank}-${leader.category}`}
                className="flex items-center gap-2 text-sm"
              >
                <span className="lf-orbitron w-6 shrink-0 text-xs font-bold text-[#64748b]">
                  {leader.rank}.
                </span>
                <span className="min-w-0 truncate font-medium text-[#e2e8f0]">
                  {leader.category}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-[#64748b]">Yükleniyor…</p>
        )}
      </div>
    </div>
  );
}
