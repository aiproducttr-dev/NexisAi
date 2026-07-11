export const CAMPAIGN_DRAFT_KEY = "nexisai_campaign_draft";

export interface CampaignDraft {
  businessName: string;
  category: string;
  productDescription: string;
  city: string;
  dailyBudget: number;
  days: number;
  step: 1 | 2 | 3;
  updatedAt: number;
}

export function saveCampaignDraft(draft: CampaignDraft) {
  try {
    localStorage.setItem(CAMPAIGN_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function loadCampaignDraft(): CampaignDraft | null {
  try {
    const raw = localStorage.getItem(CAMPAIGN_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CampaignDraft;
    if (!parsed?.businessName || !parsed?.category || !parsed?.city) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCampaignDraft() {
  try {
    localStorage.removeItem(CAMPAIGN_DRAFT_KEY);
  } catch {
    // ignore
  }
}
