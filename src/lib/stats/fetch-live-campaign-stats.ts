import {
  getLiveCampaignStats,
  type LiveCampaignStats,
} from "@/lib/stats/live-campaign-stats";

export async function fetchLiveCampaignStats(
  nowMs = Date.now(),
): Promise<LiveCampaignStats> {
  return getLiveCampaignStats(nowMs);
}
