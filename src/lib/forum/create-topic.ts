import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedForumQuestion } from "@/lib/ai/forum-question-generator";
import slugify from "slugify";

export async function createForumQuestionTopics(
  campaignId: string,
  authorId: string,
  category: string,
  city: string,
  businessName: string,
  baseSlug: string,
  questions: GeneratedForumQuestion[]
): Promise<{ count: number; slugs: string[] }> {
  if (questions.length === 0) return { count: 0, slugs: [] };

  const admin = createAdminClient();
  const slugs: string[] = [];
  let created = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const slug = slugify(`${baseSlug}-soru-${i + 1}`, {
      lower: true,
      strict: true,
      locale: "tr",
    });
    const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-5)}`;

    const { error } = await admin.from("forum_topics").insert({
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
    });

    if (!error) {
      created++;
      slugs.push(uniqueSlug);
    } else {
      console.error("Forum question topic error:", error.message);
    }
  }

  return { count: created, slugs };
}
