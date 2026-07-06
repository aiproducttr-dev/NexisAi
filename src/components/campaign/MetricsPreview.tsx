"use client";

import { useEffect, useState } from "react";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  DAYS_MAX,
  DAYS_MIN,
  calculateVisibilityMetrics,
  formatCurrency,
} from "@/lib/constants/metrics";
import { TrendingUp, Users, MessageSquare, BarChart3, HelpCircle } from "lucide-react";

interface MetricsPreviewProps {
  dailyBudget: number;
  days: number;
}

export default function MetricsPreview({
  dailyBudget,
  days,
}: MetricsPreviewProps) {
  const [animated, setAnimated] = useState(false);
  const metrics = calculateVisibilityMetrics(dailyBudget, days);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [dailyBudget, days]);

  const items = [
    {
      icon: TrendingUp,
      label: "Tahmini Görünürlük Artışı",
      value: `+%${metrics.visibilityIncrease}`,
      color: "text-emerald-400",
      description:
        "Bu bütçe ile işletmenizin ChatGPT, Gemini ve Claude gibi platformlardaki görünürlüğünün ne kadar artabileceğinin yüzdesel tahmini.",
    },
    {
      icon: Users,
      label: "Tahmini Erişim",
      value: metrics.estimatedReach.toLocaleString("tr-TR"),
      color: "text-blue-400",
      description:
        "Kampanya süresince üretilen içeriklerin ulaşması beklenen toplam kişi sayısı.",
    },
    {
      icon: MessageSquare,
      label: "Tahmini Yapay Zeka Önerisi",
      value: metrics.llmMentions.toLocaleString("tr-TR"),
      color: "text-purple-400",
      description:
        "Kullanıcılar yapay zekaya sektörünüzle ilgili soru sorduğunda işletmenizin önerilme sayısının tahmini değeri.",
    },
    {
      icon: BarChart3,
      label: "İçerik Skoru",
      value: `${metrics.contentScore}/100`,
      color: "text-amber-400",
      description:
        "Oluşturulacak içeriğin kalite, SEO ve yapay zeka uyumluluk puanı. Yüksek skor, daha iyi sıralama ve önerilme şansı demektir.",
    },
  ];

  return (
    <div className="space-y-6">
      <div
        tabIndex={0}
        className="lf-metric-card lf-card-surface group cursor-default p-6 outline-none"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <p className="text-sm text-[#94a3b8]">Toplam Kampanya Tutarı</p>
          <HelpCircle className="h-3.5 w-3.5 text-[#64748b] opacity-60 transition group-hover:opacity-100" />
        </div>
        <p className="lf-orbitron text-3xl font-bold text-white">
          {formatCurrency(metrics.totalCost)}
        </p>
        <p className="mt-1 text-sm text-[#64748b]">
          {formatCurrency(dailyBudget)} × {days} gün
        </p>
        <p className="lf-metric-desc">
          Günlük bütçe ile kampanya süresinin çarpımından oluşan toplam yatırım
          tutarınız.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            tabIndex={0}
            className={`lf-metric-card lf-card-surface group cursor-default p-4 outline-none transition-all duration-500 ${
              animated ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
              <span className="text-xs text-[#94a3b8]">{item.label}</span>
              <HelpCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-[#64748b] opacity-60 transition group-hover:opacity-100" />
            </div>
            <p className={`lf-orbitron text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>
            <p className="lf-metric-desc">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-center text-sm text-emerald-300">
          Bu bütçe ile yapay zeka platformlarında görünürlüğünüzün tahmini{" "}
          <strong>+%{metrics.visibilityIncrease}</strong> artması beklenmektedir.
        </p>
      </div>
    </div>
  );
}

export function BudgetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-[#94a3b8]">Günlük Bütçe</label>
        <span className="lf-orbitron text-lg font-bold text-cyan-400">
          {formatCurrency(value)}
        </span>
      </div>
      <input
        type="range"
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-500"
      />
      <div className="mt-1 flex justify-between text-xs text-[#64748b]">
        <span>{formatCurrency(BUDGET_MIN)}</span>
        <span>{formatCurrency(BUDGET_MAX)}</span>
      </div>
    </div>
  );
}

export function DaysSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-[#94a3b8]">Kampanya Süresi</label>
        <span className="lf-orbitron text-lg font-bold text-violet-400">
          {value} gün
        </span>
      </div>
      <input
        type="range"
        min={DAYS_MIN}
        max={DAYS_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500"
      />
      <div className="mt-1 flex justify-between text-xs text-[#64748b]">
        <span>{DAYS_MIN} gün</span>
        <span>{DAYS_MAX} gün</span>
      </div>
    </div>
  );
}
