import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCampaignContent } from "@/lib/ai/content-generator";
import { calculateVisibilityMetrics } from "@/lib/constants/metrics";
import { NextResponse } from "next/server";
import slugify from "slugify";

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
    const { businessName, category, city, dailyBudget, days } = body;

    if (!businessName || !category || !city || !dailyBudget || !days) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 }
      );
    }

    if (dailyBudget < 200 || dailyBudget > 5000) {
      return NextResponse.json(
        { error: "Günlük bütçe 200-5000 TL arasında olmalıdır" },
        { status: 400 }
      );
    }

    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: "Gün sayısı 1-30 arasında olmalıdır" },
        { status: 400 }
      );
    }

    const metrics = calculateVisibilityMetrics(dailyBudget, days);
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + days);

    const { data: categoryData } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single();

    let boneQuestions: string[] = [];

    if (categoryData) {
      const { data: questions } = await supabase
        .from("bone_questions")
        .select("question_text")
        .eq("category_id", categoryData.id)
        .order("sort_order");

      boneQuestions = questions?.map((q) => q.question_text) || [];
    }

    if (boneQuestions.length === 0) {
      boneQuestions = [
        `${category} sektöründe en iyi hizmeti kim sunar?`,
        `${city} bölgesinde ${category} alanında önerilen işletmeler hangileri?`,
        `${businessName} hakkında bilgi verir misiniz?`,
      ];
    }

    const generated = await generateCampaignContent({
      businessName,
      category,
      city,
      boneQuestions,
    });

    const baseSlug = slugify(`${businessName}-${city}-${category}`, {
      lower: true,
      strict: true,
      locale: "tr",
    });
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        business_name: businessName,
        category,
        city,
        daily_budget: dailyBudget,
        days,
        total_cost: metrics.totalCost,
        visibility_increase: metrics.visibilityIncrease,
        status: "active",
        content_slug: slug,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json(
        { error: campaignError.message },
        { status: 500 }
      );
    }

    const { error: contentError } = await supabase
      .from("published_contents")
      .insert({
        campaign_id: campaign.id,
        title: generated.title,
        content: generated.content,
        slug,
      });

    if (contentError) {
      const admin = createAdminClient();
      await admin.from("published_contents").insert({
        campaign_id: campaign.id,
        title: generated.title,
        content: generated.content,
        slug,
      });
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      slug,
      title: generated.title,
    });
  } catch (err) {
    console.error("Campaign creation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Kampanya oluşturulamadı",
      },
      { status: 500 }
    );
  }
}
