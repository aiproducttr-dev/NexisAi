import { getAppBaseUrl } from "@/lib/constants/urls";
import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { createAdminClient } from "@/lib/supabase/admin";

export const FULFILLMENT_STALE_MS = 90 * 1000;

export async function getCompletedCheckoutResult(checkoutId: string): Promise<{
  slug: string;
  campaignId: string;
  value: number;
  currency: string;
  contentName: string;
  checkoutId: string;
} | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_checkouts")
    .select("id, campaign_id, content_slug, total_cost, business_name")
    .eq("id", checkoutId)
    .single();

  if (data?.campaign_id && data.content_slug) {
    return {
      slug: data.content_slug,
      campaignId: data.campaign_id,
      value: Number(data.total_cost),
      currency: "TRY",
      contentName: data.business_name,
      checkoutId: data.id,
    };
  }

  return null;
}

export async function resetFulfillmentLock(checkoutId: string) {
  const admin = createAdminClient();
  await admin
    .from("campaign_checkouts")
    .update({ fulfillment_started_at: null })
    .eq("id", checkoutId)
    .is("campaign_id", null);
}

export async function runFulfillmentJob(checkoutId: string) {
  try {
    await fulfillPaidCheckout(checkoutId);
  } catch (error) {
    console.error("Fulfillment job failed:", error);
    await resetFulfillmentLock(checkoutId);
    throw error;
  }
}

function triggerFulfillWorker(checkoutId: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY missing; cannot trigger fulfillment worker");
    return;
  }

  const baseUrl = getAppBaseUrl();

  void fetch(`${baseUrl}/api/payments/iyzico/fulfill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ checkoutId }),
  }).catch((error) => {
    console.error("Failed to trigger fulfillment worker:", error);
  });
}

export async function scheduleFulfillmentIfNeeded(
  checkoutId: string,
): Promise<"completed" | "processing"> {
  const admin = createAdminClient();

  const completed = await getCompletedCheckoutResult(checkoutId);
  if (completed) {
    return "completed";
  }

  const { data: checkout } = await admin
    .from("campaign_checkouts")
    .select("payment_status, campaign_id, fulfillment_started_at")
    .eq("id", checkoutId)
    .single();

  if (!checkout || checkout.payment_status !== "paid") {
    return "processing";
  }

  if (checkout.campaign_id) {
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

  const { data: claimed, error: claimError } = await claimQuery
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("Fulfillment claim error:", claimError);
    return "processing";
  }

  if (claimed) {
    triggerFulfillWorker(checkoutId);
  }

  return "processing";
}
