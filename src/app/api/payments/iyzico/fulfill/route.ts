import {
  getCompletedCheckoutResult,
  runFulfillmentJob,
} from "@/lib/iyzico/schedule-fulfillment";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${serviceKey}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { checkoutId?: string };
    const checkoutId = body.checkoutId;

    if (!checkoutId) {
      return NextResponse.json({ error: "checkoutId gerekli" }, { status: 400 });
    }

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

    await runFulfillmentJob(checkoutId);

    const completed = await getCompletedCheckoutResult(checkoutId);
    if (!completed) {
      return NextResponse.json(
        { error: "Kampanya oluşturulamadı" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "completed",
      slug: completed.slug,
      campaignId: completed.campaignId,
      value: completed.value,
      currency: completed.currency,
      contentName: completed.contentName,
      checkoutId: completed.checkoutId,
    });
  } catch (error) {
    console.error("Fulfill worker error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kampanya oluşturulamadı",
      },
      { status: 500 },
    );
  }
}
