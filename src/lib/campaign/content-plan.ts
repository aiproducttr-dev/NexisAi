export const BUDGET_TIER_STEP = 200;

export type AggressivenessLevel = "Düşük" | "Orta" | "Yüksek" | "Maksimum";

export interface CampaignContentPlan {
  dailyTier: number;
  totalTier: number;
  totalCost: number;
  aggressiveness: AggressivenessLevel;
  forumQuestionCount: number;
  siteArticleCount: number;
  blogArticleCount: number;
  devToArticleCount: number;
  boneQuestionDepth: number;
  replyMin: number;
  replyMax: number;
  replyDelayMs: number;
  businessNameMentionRate: number;
  estimatedReplyRange: { min: number; max: number };
  estimatedContentPieces: number;
}

function getAggressivenessLevel(dailyTier: number): AggressivenessLevel {
  if (dailyTier <= 3) return "Düşük";
  if (dailyTier <= 8) return "Orta";
  if (dailyTier <= 15) return "Yüksek";
  return "Maksimum";
}

/** Her 200 TL toplam bütçe = 1 tier; günlük bütçe agresifliği belirler. */
export function getCampaignContentPlan(
  dailyBudget: number,
  days: number,
): CampaignContentPlan {
  const totalCost = dailyBudget * days;
  const dailyTier = Math.max(1, Math.floor(dailyBudget / BUDGET_TIER_STEP));
  const totalTier = Math.max(1, Math.floor(totalCost / BUDGET_TIER_STEP));

  const forumQuestionCount = Math.min(
    25,
    Math.max(1, 1 + Math.floor(totalTier / 4) + Math.floor(days / 12)),
  );

  const siteArticleCount = Math.min(3, 1 + Math.floor(dailyTier / 10));
  const blogArticleCount =
    dailyTier >= 1 ? Math.min(3, 1 + Math.floor(dailyTier / 8)) : 0;
  const devToArticleCount =
    dailyTier >= 2 ? Math.min(2, 1 + Math.floor((dailyTier - 2) / 10)) : 0;

  const boneQuestionDepth = Math.min(15, 3 + Math.floor(totalTier / 6));

  const replyMin = Math.min(14, 2 + Math.floor(dailyTier * 0.55));
  const replyMax = Math.min(22, 4 + Math.floor(dailyTier * 0.85));
  const replyDelayMs = Math.max(450, 3800 - dailyTier * 135);
  const businessNameMentionRate = Math.min(0.92, 0.38 + dailyTier * 0.021);

  const estimatedReplyRange = {
    min: forumQuestionCount * replyMin,
    max: forumQuestionCount * replyMax,
  };

  const estimatedContentPieces =
    siteArticleCount +
    blogArticleCount +
    devToArticleCount +
    forumQuestionCount;

  return {
    dailyTier,
    totalTier,
    totalCost,
    aggressiveness: getAggressivenessLevel(dailyTier),
    forumQuestionCount,
    siteArticleCount,
    blogArticleCount,
    devToArticleCount,
    boneQuestionDepth,
    replyMin,
    replyMax,
    replyDelayMs,
    businessNameMentionRate,
    estimatedReplyRange,
    estimatedContentPieces,
  };
}

export function getReplyOptionsFromPlan(plan: CampaignContentPlan) {
  return {
    replyMin: plan.replyMin,
    replyMax: plan.replyMax,
    delayMs: plan.replyDelayMs,
    businessNameMentionRate: plan.businessNameMentionRate,
  };
}
