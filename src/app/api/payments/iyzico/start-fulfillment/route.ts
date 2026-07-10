import {
  claimAndRunFulfillment,
  getCompletedCheckoutResult,
  repairCheckoutFulfillmentState,
} from "@/lib/iyzico/schedule-fulfillment";
import { reconcileCheckoutPayment } from "@/lib/iyzico/reconcile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const body = (await request.json()) as { checkoutId?: string };
    const checkoutId = body.checkoutId;

    if (!checkoutId) {
      return NextResponse.json({ error: "checkoutId gerekli" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: checkout, error } = await admin
      .from("campaign_checkouts")
      .select("id, user_id, payment_status")
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
        return NextResponse.json({ status: "pending_payment" });
      }
    }

    await repairCheckoutFulfillmentState(checkoutId);

    const existing = await getCompletedCheckoutResult(checkoutId);
    if (existing) {
      return NextResponse.json({
        status: "completed",
        slug: existing.slug,
        campaignId: existing.campaignId,
        value: existing.value,
        currency: existing.currency,
        contentName: existing.contentName,
        checkoutId: existing.checkoutId,
      });
    }

    const completed = await claimAndRunFulfillment(checkoutId);
    if (completed) {
      return NextResponse.json({
        status: "completed",
        slug: completed.slug,
        campaignId: completed.campaignId,
        value: completed.value,
        currency: completed.currency,
        contentName: completed.contentName,
        checkoutId: completed.checkoutId,
      });
    }

    return NextResponse.json(
      { status: "fulfilling", checkoutId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Start fulfillment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kampanya oluşturulamadı",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
