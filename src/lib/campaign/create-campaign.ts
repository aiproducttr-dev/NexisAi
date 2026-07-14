import {
  generateSiteArticle,
  generateBlogArticle,
  generateDevToArticle,
} from "@/lib/ai/content-generator";
import { generateCampaignForumQuestions } from "@/lib/ai/forum-question-generator";
import {
  buildManufacturerBoneQuestions,
  type CampaignBrief,
} from "@/lib/ai/campaign-brief";
import type { CampaignInput } from "@/lib/campaign/validate-input";
import { isManufacturerCategory } from "@/lib/constants/categories";
import {
  calculateVisibilityMetrics,
  getCampaignContentPlan,
  getReplyOptionsFromPlan,
} from "@/lib/constants/metrics";
import { forumTopicUrl } from "@/lib/constants/urls";
import { publishToDevTo } from "@/lib/devto/publish-article";
import { createForumQuestionTopics } from "@/lib/forum/create-topic";
import { replyToCampaignForumTopics } from "@/lib/forum/reply-to-campaign-topics";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishToWordPress } from "@/lib/wordpress/publish-post";
import { after } from "next/server";
import slugify from "slugify";

export interface CreateCampaignResult {
  campaignId: string;
  slug: string;
  title: string;
  contentUrl: string;
  wordpressUrl: string | null;
  devtoUrl: string | null;
  forumUrl: string | null;
  forumQuestionsCreated: number;
}

function buildSlug(
  businessName: string,
  city: string,
  category: string,
  suffix = "",
): string {
  const base = slugify(`${businessName}-${city}-${category}${suffix}`, {
    lower: true,
    strict: true,
    locale: "tr",
  });
  return `${base}-${Date.now().toString(36)}${suffix ? `-${suffix}` : ""}`;
}

export async function createCampaignForUser(
  userId: string,
  input: CampaignInput,
  options?: {
    onCampaignReady?: (result: {
      campaignId: string;
      slug: string;
    }) => Promise<void>;
  },
): Promise<CreateCampaignResult> {
  const { businessName, category, city, dailyBudget, days, productDescription } =
    input;
  const admin = createAdminClient();
  const metrics = calculateVisibilityMetrics(dailyBudget, days);
  const contentPlan = getCampaignContentPlan(dailyBudget, days);
  const replyOptions = getReplyOptionsFromPlan(contentPlan);
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + days);

  const { data: categoryData } = await admin
    .from("categories")
    .select("id")
    .eq("name", category)
    .single();

  let boneQuestions: string[] = [];

  if (isManufacturerCategory(category) && productDescription) {
    boneQuestions = buildManufacturerBoneQuestions(
      productDescription,
      city,
      businessName,
    );
  } else if (categoryData) {
    const { data: questions } = await admin
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

  const brief: CampaignBrief = {
    businessName,
    category,
    city,
    boneQuestions: boneQuestions.slice(0, contentPlan.boneQuestionDepth),
    productDescription,
  };

  const baseSlug = slugify(`${businessName}-${city}-${category}`, {
    lower: true,
    strict: true,
    locale: "tr",
  });
  const slug = buildSlug(businessName, city, category);

  // Persist campaign immediately so paid checkouts leave the "fulfilling" spinner
  // even if later AI/channel work is slow or the mobile request disconnects.
  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .insert({
      user_id: userId,
      business_name: businessName,
      category,
      city,
      product_description: productDescription,
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

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message || "Kampanya kaydedilemedi");
  }

  if (options?.onCampaignReady) {
    await options.onCampaignReady({
      campaignId: campaign.id,
      slug,
    });
  }

  const sitePromises = Array.from({ length: contentPlan.siteArticleCount }, () =>
    generateSiteArticle(brief),
  );
  const blogPromises =
    contentPlan.blogArticleCount > 0
      ? Array.from({ length: contentPlan.blogArticleCount }, () =>
          generateBlogArticle(brief),
        )
      : [];
  const devtoPromises =
    contentPlan.devToArticleCount > 0
      ? Array.from({ length: contentPlan.devToArticleCount }, () =>
          generateDevToArticle(brief),
        )
      : [];

  const [siteArticles, blogArticles, devtoArticles, forumQuestions] =
    await Promise.all([
      Promise.all(sitePromises),
      Promise.all(blogPromises),
      Promise.all(devtoPromises),
      generateCampaignForumQuestions({
        ...brief,
        count: contentPlan.forumQuestionCount,
      }),
    ]);

  const siteContent = siteArticles[0]!;

  async function insertPublishedContent(
    title: string,
    content: string,
    contentSlug: string,
  ) {
    const { error } = await admin.from("published_contents").insert({
      campaign_id: campaign.id,
      title,
      content,
      slug: contentSlug,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await insertPublishedContent(siteContent.title, siteContent.content, slug);

  for (let i = 1; i < siteArticles.length; i++) {
    const extra = siteArticles[i]!;
    const extraSlug = buildSlug(businessName, city, category, `site-${i + 1}`);
    await insertPublishedContent(extra.title, extra.content, extraSlug);
  }

  let wordpressUrl: string | null = null;
  let devtoUrl: string | null = null;

  const primaryBlog = blogArticles[0];
  const primaryDevto = devtoArticles[0];
  const channelPublishTasks: Promise<void>[] = [];

  if (primaryBlog) {
    channelPublishTasks.push(
      (async () => {
        try {
          const wordpressResult = await publishToWordPress({
            title: primaryBlog.title,
            content: primaryBlog.content,
            slug,
            category,
            city,
            businessName,
            productDescription,
          });

          if (wordpressResult) {
            wordpressUrl = wordpressResult.url;
            await admin
              .from("published_contents")
              .update({
                wordpress_post_id: wordpressResult.postId,
                wordpress_url: wordpressResult.url,
              })
              .eq("campaign_id", campaign.id)
              .eq("slug", slug);
          }
        } catch (wordpressError) {
          console.error("WordPress publish error:", wordpressError);
        }
      })(),
    );
  }

  if (primaryDevto) {
    channelPublishTasks.push(
      (async () => {
        try {
          const devtoResult = await publishToDevTo({
            title: primaryDevto.title,
            content: primaryDevto.content,
            slug,
            category,
            city,
            businessName,
            productDescription,
          });

          if (devtoResult) {
            devtoUrl = devtoResult.url;
            await admin
              .from("published_contents")
              .update({
                devto_article_id: devtoResult.articleId,
                devto_url: devtoResult.url,
              })
              .eq("campaign_id", campaign.id)
              .eq("slug", slug);
          }
        } catch (devtoError) {
          console.error("dev.to publish error:", devtoError);
        }
      })(),
    );
  }

  if (channelPublishTasks.length > 0) {
    await Promise.all(channelPublishTasks);
  }

  if (!devtoUrl && primaryDevto) {
    after(async () => {
      try {
        const devtoResult = await publishToDevTo(
          {
            title: primaryDevto.title,
            content: primaryDevto.content,
            slug,
            category,
            city,
            businessName,
            productDescription,
          },
          { maxAttempts: 4 },
        );

        if (!devtoResult) return;

        await admin
          .from("published_contents")
          .update({
            devto_article_id: devtoResult.articleId,
            devto_url: devtoResult.url,
          })
          .eq("campaign_id", campaign.id)
          .eq("slug", slug);
      } catch (devtoRetryError) {
        console.error("dev.to gecikmeli yayın hatası:", devtoRetryError);
      }
    });
  }

  for (let i = 1; i < blogArticles.length; i++) {
    const blogContent = blogArticles[i]!;
    const blogSlug = buildSlug(businessName, city, category, `blog-${i + 1}`);
    await insertPublishedContent(blogContent.title, blogContent.content, blogSlug);

    try {
      await publishToWordPress({
        title: blogContent.title,
        content: blogContent.content,
        slug: blogSlug,
        category,
        city,
        businessName,
        productDescription,
      });
    } catch (wordpressError) {
      console.error("WordPress ek yayın hatası:", wordpressError);
    }
  }

  for (let i = 1; i < devtoArticles.length; i++) {
    const devtoContent = devtoArticles[i]!;
    const devtoSlug = buildSlug(businessName, city, category, `devto-${i + 1}`);

    try {
      await publishToDevTo({
        title: devtoContent.title,
        content: devtoContent.content,
        slug: devtoSlug,
        category,
        city,
        businessName,
        productDescription,
      });
    } catch (devtoError) {
      console.error("dev.to ek yayın hatası:", devtoError);
    }
  }

  const {
    count: questionsCreated,
    slugs: forumSlugs,
    topics: forumTopics,
  } = await createForumQuestionTopics(
    campaign.id,
    userId,
    category,
    city,
    businessName,
    baseSlug,
    forumQuestions,
  );

  if (forumTopics.length > 0) {
    after(async () => {
      try {
        await replyToCampaignForumTopics(
          forumTopics,
          { businessName, category, city, productDescription },
          replyOptions,
        );
      } catch (replyError) {
        console.error("Kampanya forum cevapları hatası:", replyError);
      }
    });
  }

  const primaryForumSlug = forumSlugs[0];

  return {
    campaignId: campaign.id,
    slug,
    title: siteContent.title,
    contentUrl: `/content/${slug}`,
    wordpressUrl,
    devtoUrl,
    forumUrl: primaryForumSlug ? forumTopicUrl(primaryForumSlug) : null,
    forumQuestionsCreated: questionsCreated,
  };
}
