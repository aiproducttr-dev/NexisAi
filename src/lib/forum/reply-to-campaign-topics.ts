import { generateCampaignForumReply } from "@/lib/ai/campaign-forum-reply-generator";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTurkishForumNickname } from "@/lib/forum/turkish-nicknames";
import { notifyForumTopicIndexNow } from "@/lib/indexnow/submit";

export interface CampaignForumTopic {
  id: string;
  slug: string;
  title: string;
  body: string;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertReply(topicId: string, body: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("forum_replies").insert({
    topic_id: topicId,
    author_id: null,
    author_name: generateTurkishForumNickname(),
    body,
  });

  if (error) {
    throw new Error(`Cevap kaydedilemedi: ${error.message}`);
  }
}

export async function replyToCampaignForumTopic(
  topic: CampaignForumTopic,
  context: {
    businessName: string;
    category: string;
    city: string;
  },
  options?: { replyMin?: number; replyMax?: number; delayMs?: number },
): Promise<number> {
  const replyMin = options?.replyMin ?? 4;
  const replyMax = options?.replyMax ?? 10;
  const delayMs = options?.delayMs ?? 2500;
  const replyCount = randomBetween(replyMin, replyMax);
  const previousReplies: string[] = [];

  for (let i = 0; i < replyCount; i++) {
    if (i > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    const reply = await generateCampaignForumReply({
      businessName: context.businessName,
      category: context.category,
      city: context.city,
      topicTitle: topic.title,
      topicBody: topic.body,
      previousReplies,
      replyIndex: i,
      totalReplies: replyCount,
    });

    await insertReply(topic.id, reply.body);
    previousReplies.push(reply.body);
  }

  notifyForumTopicIndexNow(topic.slug);

  return replyCount;
}

export async function replyToCampaignForumTopics(
  topics: CampaignForumTopic[],
  context: {
    businessName: string;
    category: string;
    city: string;
  },
): Promise<void> {
  for (const topic of topics) {
    try {
      await replyToCampaignForumTopic(topic, context);
    } catch (error) {
      console.error(`Kampanya konu cevapları hatası (${topic.slug}):`, error);
    }
  }
}

export async function fetchCampaignTopicsNeedingReplies(
  limit = 5,
): Promise<
  (CampaignForumTopic & {
    business_name: string;
    category: string;
    city: string;
    reply_count: number;
  })[]
> {
  const admin = createAdminClient();
  const graceCutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("forum_topics")
    .select("id, slug, title, body, business_name, category, city, reply_count")
    .not("campaign_id", "is", null)
    .lt("reply_count", 4)
    .lt("created_at", graceCutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function processPendingCampaignForumReplies(): Promise<number> {
  const topics = await fetchCampaignTopicsNeedingReplies(5);
  let processed = 0;

  for (const topic of topics) {
    const target = randomBetween(4, 10);
    const needed = Math.max(0, target - topic.reply_count);
    if (needed === 0) continue;

    try {
      const previousReplies: string[] = [];
      for (let i = 0; i < needed; i++) {
        await sleep(2500);
        const reply = await generateCampaignForumReply({
          businessName: topic.business_name,
          category: topic.category,
          city: topic.city,
          topicTitle: topic.title,
          topicBody: topic.body,
          previousReplies,
          replyIndex: topic.reply_count + i,
          totalReplies: target,
        });
        await insertReply(topic.id, reply.body);
        previousReplies.push(reply.body);
      }
      processed++;
    } catch (error) {
      console.error(`Bekleyen kampanya cevapları hatası (${topic.slug}):`, error);
    }
  }

  return processed;
}
