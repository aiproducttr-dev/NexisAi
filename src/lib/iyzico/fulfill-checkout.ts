import { createCampaignForUser } from "@/lib/campaign/create-campaign";
import type { CampaignInput } from "@/lib/campaign/validate-input";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CampaignCheckoutRow {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  city: string;
  daily_budget: number;
  days: number;
  total_cost: number;
  conversation_id: string;
  payment_status: "pending" | "paid" | "failed";
  campaign_id: string | null;
  content_slug: string | null;
}

export async function fulfillPaidCheckout(checkoutId: string): Promise<{
  slug: string;
  campaignId: string;
}> {
  const admin = createAdminClient();

  const { data: checkout, error } = await admin
    .from("campaign_checkouts")
    .select("*")
    .eq("id", checkoutId)
    .single();

  if (error || !checkout) {
    throw new Error("Ödeme kaydı bulunamadı");
  }

  const row = checkout as CampaignCheckoutRow;

  if (row.payment_status !== "paid") {
    throw new Error("Ödeme henüz tamamlanmadı");
  }

  if (row.campaign_id && row.content_slug) {
    return { slug: row.content_slug, campaignId: row.campaign_id };
  }

  const input: CampaignInput = {
    businessName: row.business_name,
    category: row.category,
    city: row.city,
    dailyBudget: Number(row.daily_budget),
    days: row.days,
  };

  const result = await createCampaignForUser(row.user_id, input);

  await admin
    .from("campaign_checkouts")
    .update({
      campaign_id: result.campaignId,
      content_slug: result.slug,
    })
    .eq("id", checkoutId);

  return { slug: result.slug, campaignId: result.campaignId };
}
