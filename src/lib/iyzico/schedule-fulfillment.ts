import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { after } from "next/server";

const FULFILLMENT_STALE_MS = 10 * 60 * 1000;

export async function scheduleFulfillmentIfNeeded(
  checkoutId: string,
): Promise<"completed" | "processing"> {
  const admin = createAdminClient();

  const { data: checkout } = await admin
    .from("campaign_checkouts")
    .select(
      "campaign_id, content_slug, fulfillment_started_at, payment_status",
    )
    .eq("id", checkoutId)
    .single();

  if (!checkout || checkout.payment_status !== "paid") {
    return "processing";
  }

  if (checkout.campaign_id && checkout.content_slug) {
    return "completed";
  }

  const startedAt = checkout.fulfillment_started_at
    ? new Date(checkout.fulfillment_started_at).getTime()
    : null;
  const isStale =
    startedAt !== null && Date.now() - startedAt > FULFILLMENT_STALE_MS;

  if (startedAt !== null && !isStale) {
    return "processing";
  }

  let claimQuery = admin
    .from("campaign_checkouts")
    .update({ fulfillment_started_at: new Date().toISOString() })
    .eq("id", checkoutId)
    .eq("payment_status", "paid")
    .is("campaign_id", null);

  if (!isStale) {
    claimQuery = claimQuery.is("fulfillment_started_at", null);
  }

  const { data: claimed } = await claimQuery.select("id").maybeSingle();

  if (claimed) {
    after(async () => {
      try {
        await fulfillPaidCheckout(checkoutId);
      } catch (error) {
        console.error("Background fulfillment error:", error);
        await admin
          .from("campaign_checkouts")
          .update({ fulfillment_started_at: null })
          .eq("id", checkoutId)
          .is("campaign_id", null);
      }
    });
  }

  return "processing";
}

export async function getCompletedCheckoutResult(checkoutId: string): Promise<{
  slug: string;
  campaignId: string;
} | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_checkouts")
    .select("campaign_id, content_slug")
    .eq("id", checkoutId)
    .single();

  if (data?.campaign_id && data.content_slug) {
    return {
      slug: data.content_slug,
      campaignId: data.campaign_id,
    };
  }

  return null;
}
