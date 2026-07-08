import { getAppBaseUrl } from "@/lib/constants/urls";
import { retrieveCheckoutForm } from "@/lib/iyzico/client";
import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { after, NextResponse } from "next/server";

export const maxDuration = 120;

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
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const token = form.get("token");
    return typeof token === "string" ? token : null;
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const token = form.get("token");
    return typeof token === "string" ? token : null;
  }

  try {
    const json = (await request.json()) as { token?: string };
    return json.token || null;
  } catch {
    const url = new URL(request.url);
    return url.searchParams.get("token");
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
      return htmlRedirect(`${baseUrl}/payment/failure?reason=missing_token`);
    }

    const payment = await retrieveCheckoutForm(token);
    const checkoutId = payment.conversationId;

    if (!checkoutId) {
      return htmlRedirect(`${baseUrl}/payment/failure?reason=checkout_not_found`);
    }

    const admin = createAdminClient();
    const { data: checkout } = await admin
      .from("campaign_checkouts")
      .select("id, payment_status, campaign_id, content_slug")
      .eq("id", checkoutId)
      .maybeSingle();

    if (payment.status !== "success" || payment.paymentStatus !== "SUCCESS") {
      await admin
        .from("campaign_checkouts")
        .update({ payment_status: "failed" })
        .eq("id", checkoutId);

      return htmlRedirect(
        `${baseUrl}/payment/failure?checkoutId=${checkoutId}&reason=${encodeURIComponent(payment.errorMessage || "payment_failed")}`,
      );
    }

    await admin
      .from("campaign_checkouts")
      .update({
        payment_status: "paid",
        payment_id: payment.paymentId || null,
        paid_at: new Date().toISOString(),
        iyzico_token: token,
      })
      .eq("id", checkoutId);

    if (checkout?.campaign_id && checkout.content_slug) {
      return htmlRedirect(
        `${baseUrl}/dashboard?created=${checkout.content_slug}`,
      );
    }

    after(async () => {
      try {
        await fulfillPaidCheckout(checkoutId!);
      } catch (fulfillError) {
        console.error("Kampanya fulfillment hatası:", fulfillError);
      }
    });

    return htmlRedirect(`${baseUrl}/payment/processing?checkoutId=${checkoutId}`);
  } catch (error) {
    console.error("iyzico callback error:", error);
    return htmlRedirect(`${baseUrl}/payment/failure?reason=callback_error`);
  }
}
