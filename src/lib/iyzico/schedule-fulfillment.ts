import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { after } from "next/server";

/** AI + multi-channel publish regularly exceeds 90s — keep lock until job can finish. */
export const FULFILLMENT_STALE_MS = 10 * 60 * 1000;

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

  if (!data?.campaign_id || !data.content_slug) {
    return null;
  }

  const { data: campaign } = await admin
    .from("campaigns")
    .select("id")
    .eq("id", data.campaign_id)
    .maybeSingle();

  if (!campaign) {
    return null;
  }

  return {
    slug: data.content_slug,
    campaignId: data.campaign_id,
    value: Number(data.total_cost),
    currency: "TRY",
    contentName: data.business_name,
    checkoutId: data.id,
  };
}

export async function repairCheckoutFulfillmentState(checkoutId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_checkouts")
    .select("campaign_id, content_slug, fulfillment_started_at")
    .eq("id", checkoutId)
    .maybeSingle();

  if (!data || data.campaign_id) {
    return;
  }

  const updates: {
    fulfillment_started_at?: null;
    content_slug?: null;
  } = {};

  if (data.content_slug) {
    updates.content_slug = null;
  }

  const startedAt = data.fulfillment_started_at
    ? new Date(data.fulfillment_started_at).getTime()
    : null;
  const isStale =
    startedAt !== null && Date.now() - startedAt > FULFILLMENT_STALE_MS;

  if (startedAt !== null && isStale) {
    updates.fulfillment_started_at = null;
  }

  if (Object.keys(updates).length > 0) {
    await admin.from("campaign_checkouts").update(updates).eq("id", checkoutId);
  }
}

export async function resetFulfillmentLock(checkoutId: string) {
  const admin = createAdminClient();
  await admin
    .from("campaign_checkouts")
    .update({
      fulfillment_started_at: null,
      content_slug: null,
    })
    .eq("id", checkoutId)
    .is("campaign_id", null);
}

export async function runFulfillmentJob(checkoutId: string) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY tanımlı değil");
  }

  try {
    await fulfillPaidCheckout(checkoutId);
  } catch (error) {
    console.error("Fulfillment job failed:", error);
    await resetFulfillmentLock(checkoutId);
    throw error;
  }
}

/** Run fulfillment in this isolate after the HTTP response (mobile-safe). */
function scheduleInlineFulfillment(checkoutId: string) {
  after(async () => {
    try {
      await runFulfillmentJob(checkoutId);
    } catch (error) {
      console.error("Inline fulfillment after() failed:", error);
    }
  });
}

export async function tryClaimFulfillment(
  checkoutId: string,
): Promise<"claimed" | "running" | "completed"> {
  const completed = await getCompletedCheckoutResult(checkoutId);
  if (completed) {
    return "completed";
  }

  const admin = createAdminClient();
  const { data: checkout } = await admin
    .from("campaign_checkouts")
    .select("payment_status, campaign_id, fulfillment_started_at")
    .eq("id", checkoutId)
    .single();

  if (!checkout || checkout.payment_status !== "paid") {
    return "running";
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
    return "running";
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
    return "running";
  }

  if (!claimed) {
    return "running";
  }

  return "claimed";
}

export async function claimAndRunFulfillment(checkoutId: string) {
  await repairCheckoutFulfillmentState(checkoutId);

  const claimState = await tryClaimFulfillment(checkoutId);
  if (claimState === "completed") {
    return getCompletedCheckoutResult(checkoutId);
  }

  if (claimState === "running") {
    return null;
  }

  await runFulfillmentJob(checkoutId);
  return getCompletedCheckoutResult(checkoutId);
}

export async function scheduleFulfillmentIfNeeded(
  checkoutId: string,
): Promise<"completed" | "processing"> {
  await repairCheckoutFulfillmentState(checkoutId);

  const completed = await getCompletedCheckoutResult(checkoutId);
  if (completed) {
    return "completed";
  }

  const claimState = await tryClaimFulfillment(checkoutId);
  if (claimState === "completed") {
    return "completed";
  }

  if (claimState === "claimed") {
    // In-process after() — avoids mobile request timeout and apex→www auth strip.
    scheduleInlineFulfillment(checkoutId);
  }

  return "processing";
}
