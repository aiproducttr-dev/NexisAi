/** Shared live stats — same values for every visitor at the same time. */

export const ACTIVE_CAMPAIGNS_BASE = 1320;
/** Epoch: 11 Jul 2026 09:00 Turkey (UTC+3) — counter starts at BASE here. */
export const ACTIVE_CAMPAIGNS_EPOCH_MS = Date.UTC(2026, 6, 11, 6, 0, 0);
export const ACTIVE_CAMPAIGNS_SLOT_MS = 10 * 60 * 1000;

export interface CategoryLeader {
  rank: number;
  category: string;
  campaignCount: number;
}

export interface LiveCampaignStats {
  activeCampaigns: number;
  nextIncrementAt: number;
  leaders: CategoryLeader[];
  leadersHourKey: string;
  leadersNextChangeAt: number;
}

function slotIncrement(slot: number): number {
  // Deterministic 4–10 for each 10-minute slot
  let x = (slot + 1) * 2654435761 >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return 4 + (x % 7);
}

export function getActiveCampaignsSlot(nowMs = Date.now()): number {
  return Math.max(
    0,
    Math.floor((nowMs - ACTIVE_CAMPAIGNS_EPOCH_MS) / ACTIVE_CAMPAIGNS_SLOT_MS),
  );
}

export function getActiveCampaignCount(nowMs = Date.now()): number {
  const slots = getActiveCampaignsSlot(nowMs);
  let total = ACTIVE_CAMPAIGNS_BASE;
  for (let i = 0; i < slots; i++) {
    total += slotIncrement(i);
  }
  return total;
}

export function getNextActiveCampaignIncrementAt(nowMs = Date.now()): number {
  const slots = getActiveCampaignsSlot(nowMs);
  return ACTIVE_CAMPAIGNS_EPOCH_MS + (slots + 1) * ACTIVE_CAMPAIGNS_SLOT_MS;
}

export function getHourBucketKey(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}`;
}

export function getNextHourChangeAt(nowMs = Date.now()): number {
  const d = new Date(nowMs);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(d.getUTCHours() + 1);
  return d.getTime();
}

function hourHash(category: string, hourKey: string): number {
  const input = `${hourKey}:${category}`;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Rank categories by real campaign count; ties / empty slots use a
 * deterministic hourly seed so 2nd/3rd (and full list when sparse) rotate hourly.
 */
export function rankCategoryLeaders(
  categoryNames: string[],
  countsByCategory: Record<string, number>,
  hourKey: string,
  limit = 3,
): CategoryLeader[] {
  const unique = [...new Set(categoryNames.filter(Boolean))];

  const ranked = unique
    .map((category) => {
      const campaignCount = countsByCategory[category] ?? 0;
      const score = campaignCount * 1_000_000 + hourHash(category, hourKey);
      return { category, campaignCount, score };
    })
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category, "tr"))
    .slice(0, limit);

  return ranked.map((item, index) => ({
    rank: index + 1,
    category: item.category,
    campaignCount: item.campaignCount,
  }));
}
