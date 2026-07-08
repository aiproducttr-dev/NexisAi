import { createCampaignForUser } from "@/lib/campaign/create-campaign";
import {
  isPaymentBypassEnabled,
  validateCampaignInput,
} from "@/lib/campaign/validate-input";
import { calculateVisibilityMetrics } from "@/lib/constants/metrics";
import { getAppBaseUrl } from "@/lib/constants/urls";
import { initializeCheckoutForm } from "@/lib/iyzico/client";
import { buildCheckoutInitializeRequest } from "@/lib/iyzico/checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const input = validateCampaignInput(body);
    const metrics = calculateVisibilityMetrics(input.dailyBudget, input.days);
    const admin = createAdminClient();

    if (isPaymentBypassEnabled()) {
      const result = await createCampaignForUser(user.id, input);
      return NextResponse.json({
        bypass: true,
        redirectUrl: `${getAppBaseUrl()}/dashboard?created=${result.slug}`,
      });
    }

    const checkoutId = crypto.randomUUID();
    const { data: checkout, error: checkoutError } = await admin
      .from("campaign_checkouts")
      .insert({
        id: checkoutId,
        user_id: user.id,
        business_name: input.businessName,
        category: input.category,
        city: input.city,
        daily_budget: input.dailyBudget,
        days: input.days,
        total_cost: metrics.totalCost,
        conversation_id: checkoutId,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (checkoutError || !checkout) {
      return NextResponse.json(
        { error: checkoutError?.message || "Ödeme oturumu oluşturulamadı" },
        { status: 500 },
      );
    }

    const initializeRequest = buildCheckoutInitializeRequest(
      checkoutId,
      input,
      {
        id: user.id,
        email: user.email || `user-${user.id}@nexisai.local`,
        fullName:
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null,
        ip: getClientIp(request),
      },
    );

    const iyzicoResult = await initializeCheckoutForm(initializeRequest);

    if (iyzicoResult.status !== "success" || !iyzicoResult.paymentPageUrl) {
      await admin
        .from("campaign_checkouts")
        .update({ payment_status: "failed" })
        .eq("id", checkoutId);

      return NextResponse.json(
        {
          error:
            iyzicoResult.errorMessage ||
            "iyzico ödeme sayfası oluşturulamadı",
        },
        { status: 502 },
      );
    }

    await admin
      .from("campaign_checkouts")
      .update({ iyzico_token: iyzicoResult.token || null })
      .eq("id", checkoutId);

    return NextResponse.json({
      checkoutId,
      paymentPageUrl: iyzicoResult.paymentPageUrl,
      processingUrl: `${getAppBaseUrl()}/payment/processing?checkoutId=${checkoutId}`,
    });
  } catch (err) {
    console.error("iyzico initialize error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Ödeme başlatılamadı",
      },
      { status: 500 },
    );
  }
}
