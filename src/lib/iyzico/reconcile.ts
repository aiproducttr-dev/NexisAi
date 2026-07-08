import { retrieveCheckoutForm } from "@/lib/iyzico/client";
import {
  isPaymentFailed,
  isPaymentSuccessful,
} from "@/lib/iyzico/payment-result";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CampaignCheckoutRecord {
  id: string;
  user_id: string;
  iyzico_token: string | null;
  payment_status: string;
  payment_id: string | null;
  campaign_id: string | null;
  content_slug: string | null;
}

export async function findCheckoutByToken(
  token: string,
): Promise<CampaignCheckoutRecord | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_checkouts")
    .select("id, user_id, iyzico_token, payment_status, payment_id, campaign_id, content_slug")
    .eq("iyzico_token", token)
    .maybeSingle();

  return data as CampaignCheckoutRecord | null;
}

export async function reconcileCheckoutPayment(checkoutId: string): Promise<{
  paid: boolean;
  checkout: CampaignCheckoutRecord | null;
  payment?: Awaited<ReturnType<typeof retrieveCheckoutForm>>;
}> {
  const admin = createAdminClient();
  const { data: checkout, error } = await admin
    .from("campaign_checkouts")
    .select("id, user_id, iyzico_token, payment_status, payment_id, campaign_id, content_slug")
    .eq("id", checkoutId)
    .single();

  if (error || !checkout) {
    throw new Error("Ödeme kaydı bulunamadı");
  }

  const row = checkout as CampaignCheckoutRecord;

  if (row.payment_status === "paid") {
    return { paid: true, checkout: row };
  }

  if (!row.iyzico_token) {
    return { paid: false, checkout: row };
  }

  const payment = await retrieveCheckoutForm(row.iyzico_token, row.id);

  if (isPaymentSuccessful(payment)) {
    await admin
      .from("campaign_checkouts")
      .update({
        payment_status: "paid",
        payment_id: payment.paymentId || row.payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", checkoutId);

    return {
      paid: true,
      checkout: { ...row, payment_status: "paid" },
      payment,
    };
  }

  if (isPaymentFailed(payment)) {
    await admin
      .from("campaign_checkouts")
      .update({ payment_status: "failed" })
      .eq("id", checkoutId);
  }

  return { paid: false, checkout: row, payment };
}

export async function markCheckoutPaid(
  checkoutId: string,
  token: string,
  payment: Awaited<ReturnType<typeof retrieveCheckoutForm>>,
) {
  const admin = createAdminClient();
  await admin
    .from("campaign_checkouts")
    .update({
      payment_status: "paid",
      payment_id: payment.paymentId || null,
      paid_at: new Date().toISOString(),
      iyzico_token: token,
    })
    .eq("id", checkoutId);
}
