import { getAppBaseUrl } from "@/lib/constants/urls";
import { retrieveCheckoutForm } from "@/lib/iyzico/client";
import {
  isPaymentFailed,
  isPaymentSuccessful,
} from "@/lib/iyzico/payment-result";
import {
  findCheckoutByToken,
  markCheckoutPaid,
} from "@/lib/iyzico/reconcile";
import { scheduleFulfillmentIfNeeded } from "@/lib/iyzico/schedule-fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const maxDuration = 60;

function htmlRedirect(url: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${url}"/><title>Yönlendiriliyor</title></head><body><p>Ödeme sonucu işleniyor…</p><script>location.replace(${JSON.stringify(url)})</script></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

async function extractToken(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  try {
    const raw = await request.text();
    if (!raw) return null;

    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      const json = JSON.parse(trimmed) as { token?: string };
      return json.token || null;
    }

    const params = new URLSearchParams(trimmed);
    const token = params.get("token");
    return token || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  return handleCallback(request);
}

async function handleCallback(request: Request) {
  const baseUrl = getAppBaseUrl();

  try {
    const token = await extractToken(request);

    if (!token) {
      console.error("iyzico callback: token bulunamadı");
      return htmlRedirect(`${baseUrl}/payment/failure?reason=missing_token`);
    }

    const checkoutByToken = await findCheckoutByToken(token);
    const payment = await retrieveCheckoutForm(token, checkoutByToken?.id);
    const checkoutId = payment.conversationId || checkoutByToken?.id || null;

    if (!checkoutId) {
      console.error("iyzico callback: checkoutId bulunamadı", payment);
      return htmlRedirect(`${baseUrl}/payment/failure?reason=checkout_not_found`);
    }

    const admin = createAdminClient();
    const { data: checkout } = await admin
      .from("campaign_checkouts")
      .select("id, payment_status, campaign_id, content_slug")
      .eq("id", checkoutId)
      .maybeSingle();

    if (!isPaymentSuccessful(payment)) {
      console.error("iyzico callback: ödeme başarısız veya bekliyor", payment);

      if (isPaymentFailed(payment)) {
        await admin
          .from("campaign_checkouts")
          .update({ payment_status: "failed" })
          .eq("id", checkoutId);

        return htmlRedirect(
          `${baseUrl}/payment/failure?checkoutId=${checkoutId}&reason=${encodeURIComponent(payment.errorMessage || "payment_failed")}`,
        );
      }

      return htmlRedirect(
        `${baseUrl}/payment/processing?checkoutId=${checkoutId}`,
      );
    }

    await markCheckoutPaid(checkoutId, token, payment);

    if (checkout?.campaign_id && checkout.content_slug) {
      return htmlRedirect(
        `${baseUrl}/dashboard?created=${checkout.content_slug}`,
      );
    }

    await scheduleFulfillmentIfNeeded(checkoutId);

    return htmlRedirect(`${baseUrl}/payment/processing?checkoutId=${checkoutId}`);
  } catch (error) {
    console.error("iyzico callback error:", error);
    const url = new URL(request.url);
    const checkoutId = url.searchParams.get("checkoutId");
    if (checkoutId) {
      return htmlRedirect(
        `${baseUrl}/payment/processing?checkoutId=${checkoutId}`,
      );
    }
    return htmlRedirect(`${baseUrl}/payment/failure?reason=callback_error`);
  }
}
