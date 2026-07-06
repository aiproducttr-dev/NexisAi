import { createAdminClient } from "@/lib/supabase/admin";

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

    const forumBody = buildForumBody(input);

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

function buildForumBody(input: CreateForumTopicInput): string {
  const excerpt = input.body.slice(0, 600).trim();
  const trimmed =
    excerpt.length < input.body.length ? `${excerpt}...` : excerpt;

  return `${trimmed}

---
📍 **${input.city}** · **${input.category}**
🏢 **${input.businessName}**

Bu konu NexisAI görünürlük kampanyası kapsamında otomatik oluşturulmuştur. Deneyimlerinizi ve önerilerinizi paylaşabilirsiniz.`;
}
