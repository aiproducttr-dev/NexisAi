import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedForumQuestion } from "@/lib/ai/forum-question-generator";
import slugify from "slugify";

interface CreateForumTopicInput {
  campaignId: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  city: string;
  businessName: string;
  authorId: string;
  contentSlug: string;
}

export async function createForumTopicForCampaign(
  input: CreateForumTopicInput
): Promise<{ topicId: string; slug: string } | null> {
  try {
    const admin = createAdminClient();
    const forumBody = buildCampaignForumBody(input);

    const { data, error } = await admin
      .from("forum_topics")
      .insert({
        campaign_id: input.campaignId,
        slug: input.slug,
        title: input.title,
        body: forumBody,
        category: input.category,
        city: input.city,
        business_name: input.businessName,
        content_slug: input.contentSlug,
        author_id: input.authorId,
        topic_type: "campaign",
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Forum topic creation error:", error.message);
      return null;
    }

    return { topicId: data.id, slug: data.slug };
  } catch (err) {
    console.error("Forum topic creation error:", err);
    return null;
  }
}

export async function createForumQuestionTopics(
  campaignId: string,
  authorId: string,
  category: string,
  city: string,
  businessName: string,
  baseSlug: string,
  questions: GeneratedForumQuestion[]
): Promise<number> {
  if (questions.length === 0) return 0;

  const admin = createAdminClient();
  let created = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const slug = `${baseSlug}-s${i + 1}-${Date.now().toString(36).slice(-4)}`;

    const { error } = await admin.from("forum_topics").insert({
      campaign_id: campaignId,
      slug,
      title: q.title,
      body: q.body,
      category,
      city,
      business_name: businessName,
      author_id: authorId,
      topic_type: "question",
      source_question: q.sourceQuestion,
      display_author_name: q.authorName,
    });

    if (!error) created++;
    else console.error("Forum question topic error:", error.message);
  }

  return created;
}

function buildCampaignForumBody(input: CreateForumTopicInput): string {
  const excerpt = input.body.slice(0, 600).trim();
  const trimmed =
    excerpt.length < input.body.length ? `${excerpt}...` : excerpt;

  return `${trimmed}

---
📍 **${input.city}** · **${input.category}**
🏢 **${input.businessName}**

Bu konu NexisAI görünürlük kampanyası kapsamında otomatik oluşturulmuştur. Deneyimlerinizi ve önerilerinizi paylaşabilirsiniz.`;
}
