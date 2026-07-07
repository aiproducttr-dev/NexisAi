import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedForumQuestion } from "@/lib/ai/forum-question-generator";
import type { CampaignForumTopic } from "@/lib/forum/reply-to-campaign-topics";
import { notifyForumTopicsIndexNow } from "@/lib/indexnow/submit";
import slugify from "slugify";

export async function createForumQuestionTopics(
  campaignId: string,
  authorId: string,
  category: string,
  city: string,
  businessName: string,
  baseSlug: string,
  questions: GeneratedForumQuestion[]
): Promise<{ count: number; slugs: string[]; topics: CampaignForumTopic[] }> {
  if (questions.length === 0) return { count: 0, slugs: [], topics: [] };

  const admin = createAdminClient();
  const slugs: string[] = [];
  const topics: CampaignForumTopic[] = [];
  let created = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const slug = slugify(`${baseSlug}-soru-${i + 1}`, {
      lower: true,
      strict: true,
      locale: "tr",
    });
    const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-5)}`;

    const { data, error } = await admin.from("forum_topics").insert({
      campaign_id: campaignId,
      slug: uniqueSlug,
      title: q.title,
      body: q.body,
      category,
      city,
      business_name: businessName,
      author_id: authorId,
      topic_type: "question",
      source_question: q.sourceQuestion,
      display_author_name: q.authorName,
      content_slug: null,
    }).select("id, slug, title, body").single();

    if (!error && data) {
      created++;
      slugs.push(uniqueSlug);
      topics.push(data);
    } else {
      console.error("Forum question topic error:", error?.message);
    }
  }

  if (slugs.length > 0) {
    notifyForumTopicsIndexNow(slugs);
  }

  return { count: created, slugs, topics };
}
