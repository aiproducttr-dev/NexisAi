import { createCampaignForUser } from "@/lib/campaign/create-campaign";
import { validateCampaignInput } from "@/lib/campaign/validate-input";
import {
  FREE_TRIAL_DAILY_BUDGET,
  FREE_TRIAL_DAYS,
} from "@/lib/auth/free-trial";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("used_free_trial, trial_business_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.used_free_trial) {
      return NextResponse.json(
        { error: "Ücretsiz deneme hakkınız bulunmuyor" },
        { status: 403 },
      );
    }

    const { data: existingTrial } = await admin
      .from("campaigns")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_free_trial", true)
      .limit(1)
      .maybeSingle();

    if (existingTrial) {
      return NextResponse.json(
        { error: "Ücretsiz deneme kampanyanız zaten oluşturulmuş" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const input = validateCampaignInput({
      ...body,
      dailyBudget: FREE_TRIAL_DAILY_BUDGET,
      days: FREE_TRIAL_DAYS,
    });

    const result = await createCampaignForUser(user.id, input, {
      isFreeTrial: true,
    });

    return NextResponse.json({
      success: true,
      trial: true,
      campaignId: result.campaignId,
      slug: result.slug,
      redirectUrl: `/dashboard?created=${result.slug}`,
    });
  } catch (err) {
    console.error("Free trial campaign error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Kampanya oluşturulamadı",
      },
      { status: 500 },
    );
  }
}
