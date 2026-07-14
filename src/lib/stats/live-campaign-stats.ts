/** Shared live stats — same values for every visitor at the same time. */

export const ACTIVE_CAMPAIGNS_BASE = 1320;
/** Epoch: 11 Jul 2026 09:00 Turkey (UTC+3) — counter starts at BASE here. */
export const ACTIVE_CAMPAIGNS_EPOCH_MS = Date.UTC(2026, 6, 11, 6, 0, 0);
export const ACTIVE_CAMPAIGNS_SLOT_MS = 10 * 60 * 1000;

export interface CampaignLeader {
  rank: number;
  city: string;
  category: string;
  businessName: string;
}

export interface LiveCampaignStats {
  activeCampaigns: number;
  nextIncrementAt: number;
  leaders: CampaignLeader[];
}

/** Featured campaign leaders shown to all visitors. */
export const CAMPAIGN_LEADERS: CampaignLeader[] = [
  {
    rank: 1,
    city: "İzmir",
    category: "Klinik & Sağlık",
    businessName: "Smile İzmir",
  },
  {
    rank: 2,
    city: "İstanbul",
    category: "Güvenlik filesi",
    businessName: "Güçlü File",
  },
  {
    rank: 3,
    city: "Bursa",
    category: "Veteriner",
    businessName: "Vetorka Veteriner Kliniği",
  },
];

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

export function getLiveCampaignStats(nowMs = Date.now()): LiveCampaignStats {
  return {
    activeCampaigns: getActiveCampaignCount(nowMs),
    nextIncrementAt: getNextActiveCampaignIncrementAt(nowMs),
    leaders: CAMPAIGN_LEADERS,
  };
}
