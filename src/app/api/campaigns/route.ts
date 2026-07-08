import { createClient } from "@/lib/supabase/server";
import { createCampaignForUser } from "@/lib/campaign/create-campaign";
import {
  isPaymentBypassEnabled,
  validateCampaignInput,
} from "@/lib/campaign/validate-input";
import { getCampaignContentPlan } from "@/lib/constants/metrics";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    if (!isPaymentBypassEnabled()) {
      return NextResponse.json(
        { error: "Kampanya başlatmak için ödeme gereklidir" },
        { status: 402 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const input = validateCampaignInput(body);
    const contentPlan = getCampaignContentPlan(input.dailyBudget, input.days);
    const result = await createCampaignForUser(user.id, input);

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      slug: result.slug,
      title: result.title,
      contentUrl: result.contentUrl,
      wordpressUrl: result.wordpressUrl,
      devtoUrl: result.devtoUrl,
      forumUrl: result.forumUrl,
      forumQuestionsCreated: result.forumQuestionsCreated,
      contentPlan: {
        aggressiveness: contentPlan.aggressiveness,
        estimatedContentPieces: contentPlan.estimatedContentPieces,
        forumQuestionCount: contentPlan.forumQuestionCount,
        replyRange: `${contentPlan.replyMin}-${contentPlan.replyMax}`,
      },
    });
  } catch (err) {
    console.error("Campaign creation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Kampanya oluşturulamadı",
      },
      { status: 500 },
    );
  }
}
