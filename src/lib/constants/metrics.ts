import type { VisibilityMetrics } from "@/lib/types";

export const BUDGET_MIN = 200;
export const BUDGET_MAX = 5000;
export const DAYS_MIN = 1;
export const DAYS_MAX = 30;

export function calculateVisibilityMetrics(
  dailyBudget: number,
  days: number
): VisibilityMetrics {
  const totalCost = dailyBudget * days;

  let visibilityIncrease: number;
  if (totalCost <= 2000) {
    visibilityIncrease = 5 + ((totalCost - 200) / (2000 - 200)) * 10;
  } else if (totalCost <= 10000) {
    visibilityIncrease = 15 + ((totalCost - 2000) / (10000 - 2000)) * 20;
  } else if (totalCost <= 50000) {
    visibilityIncrease = 35 + ((totalCost - 10000) / (50000 - 10000)) * 25;
  } else {
    visibilityIncrease = 60 + ((totalCost - 50000) / (150000 - 50000)) * 25;
  }

  visibilityIncrease = Math.round(visibilityIncrease * 10) / 10;

  const estimatedReach = Math.round(totalCost * 12 + visibilityIncrease * 150);
  const llmMentions = Math.round(totalCost / 80 + days * 2);
  const contentScore = Math.min(99, Math.round(40 + visibilityIncrease * 0.7));

  return {
    totalCost,
    visibilityIncrease,
    estimatedReach,
    llmMentions,
    contentScore,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}
