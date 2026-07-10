import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { reconcileCheckoutPayment } from "@/lib/iyzico/reconcile";
import {
  getCompletedCheckoutResult,
  scheduleFulfillmentIfNeeded,
} from "@/lib/iyzico/schedule-fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const checkoutId = new URL(request.url).searchParams.get("checkoutId");
    if (!checkoutId) {
      return NextResponse.json({ error: "checkoutId gerekli" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: checkout, error } = await admin
      .from("campaign_checkouts")
      .select("id, user_id, payment_status, campaign_id, content_slug")
      .eq("id", checkoutId)
      .single();

    if (error || !checkout) {
      return NextResponse.json({ error: "Ödeme kaydı bulunamadı" }, { status: 404 });
    }

    if (checkout.user_id !== user.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    if (checkout.payment_status === "failed") {
      return NextResponse.json({ status: "failed" });
    }

    if (checkout.payment_status !== "paid") {
      const reconciled = await reconcileCheckoutPayment(checkoutId);
      if (!reconciled.paid) {
        return NextResponse.json(
          { status: "pending_payment" },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    const existing = await getCompletedCheckoutResult(checkoutId);
    if (existing) {
      return NextResponse.json(
        {
          status: "completed",
          slug: existing.slug,
          campaignId: existing.campaignId,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const fulfillmentState = await scheduleFulfillmentIfNeeded(checkoutId);

    if (fulfillmentState === "completed") {
      const completed = await getCompletedCheckoutResult(checkoutId);
      if (completed) {
        return NextResponse.json(
          {
            status: "completed",
            slug: completed.slug,
            campaignId: completed.campaignId,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    return NextResponse.json(
      { status: "processing" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Payment status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Durum alınamadı" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
