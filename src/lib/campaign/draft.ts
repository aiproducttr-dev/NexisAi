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

function normalizeStep(step: unknown): 1 | 2 | 3 {
  if (step === 1 || step === 2 || step === 3) return step;
  if (step === "1" || step === "2" || step === "3") {
    return Number(step) as 1 | 2 | 3;
  }
  return 3;
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
    const parsed = JSON.parse(raw) as Partial<CampaignDraft>;
    const businessName = String(parsed?.businessName || "");
    const category = String(parsed?.category || "");
    const city = String(parsed?.city || "");
    if (!businessName && !category && !city) {
      return null;
    }
    return {
      businessName,
      category,
      productDescription: String(parsed.productDescription || ""),
      city,
      dailyBudget: Number(parsed.dailyBudget) || 0,
      days: Number(parsed.days) || 0,
      step: normalizeStep(parsed.step),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
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
