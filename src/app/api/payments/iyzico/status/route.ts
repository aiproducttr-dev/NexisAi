import { fulfillPaidCheckout } from "@/lib/iyzico/fulfill-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 120;

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
      return NextResponse.json({ status: "pending_payment" });
    }

    if (checkout.campaign_id && checkout.content_slug) {
      return NextResponse.json({
        status: "completed",
        slug: checkout.content_slug,
        campaignId: checkout.campaign_id,
      });
    }

    try {
      const result = await fulfillPaidCheckout(checkoutId);
      return NextResponse.json({
        status: "completed",
        slug: result.slug,
        campaignId: result.campaignId,
      });
    } catch (fulfillError) {
      console.error("Status fulfillment error:", fulfillError);
      return NextResponse.json({ status: "processing" });
    }
  } catch (err) {
    console.error("Payment status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Durum alınamadı" },
      { status: 500 },
    );
  }
}
