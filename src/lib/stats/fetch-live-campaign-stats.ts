import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveCampaignCount,
  getHourBucketKey,
  getNextActiveCampaignIncrementAt,
  getNextHourChangeAt,
  rankCategoryLeaders,
  type LiveCampaignStats,
} from "@/lib/stats/live-campaign-stats";

export async function fetchLiveCampaignStats(
  nowMs = Date.now(),
): Promise<LiveCampaignStats> {
  const admin = createAdminClient();
  const hourKey = getHourBucketKey(nowMs);

  const [{ data: categories }, { data: campaigns }] = await Promise.all([
    admin.from("categories").select("name"),
    admin.from("campaigns").select("category"),
  ]);

  const countsByCategory: Record<string, number> = {};
  for (const row of campaigns ?? []) {
    const name = row.category?.trim();
    if (!name) continue;
    countsByCategory[name] = (countsByCategory[name] ?? 0) + 1;
  }

  const categoryNames = [
    ...new Set([
      ...(categories ?? []).map((c) => c.name),
      ...Object.keys(countsByCategory),
    ]),
  ];

  return {
    activeCampaigns: getActiveCampaignCount(nowMs),
    nextIncrementAt: getNextActiveCampaignIncrementAt(nowMs),
    leaders: rankCategoryLeaders(categoryNames, countsByCategory, hourKey, 3),
    leadersHourKey: hourKey,
    leadersNextChangeAt: getNextHourChangeAt(nowMs),
  };
}
