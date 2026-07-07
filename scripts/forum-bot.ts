/**
 * NexisAI Form forum bot — paralel konu dalgaları + bağımsız cevap döngüleri.
 *
 * Tek döngü:  npm run forum-bot
 * Sürekli:    npm run forum-bot:daemon
 *
 * Varsayılan: Her 5 dk'da 20 farklı hesaptan 20 konu (≈15 sn arayla).
 * Her konuya 4-10 cevap, cevaplar arası 10 sn (konu bağımsız devam eder).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib/load-env";
import { createRandomForumAccount } from "./lib/turkish-nicknames";
import {
  createProxiedFetch,
  loadProxyList,
  maskProxy,
  pickRandomProxy,
  resolveOutboundIp,
} from "./lib/proxy";
import { TURKISH_CITIES } from "../src/lib/constants/cities";
import { buildOrganicTopicSlug } from "../src/lib/forum/organic-topic";

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const baseUrl = (
  process.env.FORUM_BOT_BASE_URL ||
  process.env.NEXT_PUBLIC_FORUM_URL ||
  "https://nexisaiform.com"
).replace(/\/$/, "");

const waveIntervalMs = Number(
  process.env.FORUM_BOT_WAVE_INTERVAL_MS || 5 * 60 * 1000
);
const topicsPerWave = Number(process.env.FORUM_BOT_TOPICS_PER_WAVE || 20);
const topicStaggerMs = Number(
  process.env.FORUM_BOT_TOPIC_STAGGER_MS ||
    Math.floor(waveIntervalMs / topicsPerWave)
);
const replyDelayMs = Number(process.env.FORUM_BOT_REPLY_DELAY_MS || 10 * 1000);
const replyMin = Number(process.env.FORUM_BOT_REPLY_MIN || 4);
const replyMax = Number(process.env.FORUM_BOT_REPLY_MAX || 10);
const daemonMode = process.argv.includes("--daemon");
const proxyPool = loadProxyList();

let activeReplyLoops = 0;

interface BotAccount {
  email: string;
  password: string;
  fullName: string;
  proxy?: string;
}

interface CategoryRow {
  id: string;
  name: string;
}

interface TopicContext {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  city: string;
}

function withProxy(account: BotAccount): BotAccount {
  return {
    ...account,
    proxy: pickRandomProxy(proxyPool),
  };
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function formatWait(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} sn`;
  return `${Math.round(ms / 60000)} dk`;
}

function log(message: string) {
  const time = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
  console.log(`[${time}] ${message}`);
}

function getAdminDb(): SupabaseClient {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY gerekli");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function registerOnForum(account: BotAccount): Promise<void> {
  const proxiedFetch = createProxiedFetch(account.proxy);

  const res = await proxiedFetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
      fullName: account.fullName,
    }),
  });

  if (res.ok) return;

  const data = (await res.json()) as { error?: string };
  if (res.status === 409) return;

  throw new Error(`Kayıt hatası (${account.fullName}): ${data.error || res.status}`);
}

async function signIn(account: BotAccount) {
  const proxiedFetch = createProxiedFetch(account.proxy);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: proxiedFetch as typeof fetch },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (error || !data.session) {
    throw new Error(`Giriş hatası (${account.fullName}): ${error?.message}`);
  }

  return { supabase, session: data.session };
}

async function apiPost(
  path: string,
  body: unknown,
  accessToken: string,
  proxy?: string
): Promise<Record<string, unknown>> {
  const proxiedFetch = createProxiedFetch(proxy);
  const res = await proxiedFetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`API ${path} geçersiz yanıt (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(`API ${path}: ${(data.error as string) || res.status}`);
  }
  return data;
}

async function createTopic(
  supabase: SupabaseClient,
  userId: string,
  input: {
    title: string;
    body: string;
    category: string;
    city: string;
    authorName: string;
    sourceQuestion?: string;
  }
) {
  const slug = buildOrganicTopicSlug(input.title);

  const { data: topic, error } = await supabase
    .from("forum_topics")
    .insert({
      campaign_id: null,
      slug,
      title: input.title,
      body: input.body,
      category: input.category,
      city: input.city,
      business_name: "",
      content_slug: null,
      author_id: userId,
      topic_type: "question",
      source_question: input.sourceQuestion ?? null,
      display_author_name: input.authorName,
    })
    .select("id, slug, title")
    .single();

  if (error) throw new Error(`Konu oluşturulamadı: ${error.message}`);
  return topic;
}

async function createReply(
  supabase: SupabaseClient,
  userId: string,
  authorName: string,
  topicId: string,
  body: string
) {
  const { error } = await supabase.from("forum_replies").insert({
    topic_id: topicId,
    author_id: userId,
    author_name: authorName,
    body,
  });

  if (error) throw new Error(`Cevap gönderilemedi: ${error.message}`);
}

async function postReply(
  account: BotAccount,
  topicId: string,
  body: string
): Promise<void> {
  const { supabase, session } = await signIn(account);

  try {
    await apiPost(
      "/api/forum/replies",
      { topicId, body },
      session.access_token,
      account.proxy
    );
  } catch {
    await createReply(supabase, session.user.id, account.fullName, topicId, body);
  }
}

async function pickBoneQuestions(
  db: SupabaseClient,
  category: CategoryRow
): Promise<string[]> {
  const { data: boneRows } = await db
    .from("bone_questions")
    .select("question_text")
    .eq("category_id", category.id)
    .limit(50);

  const boneQuestions =
    boneRows?.map((r) => r.question_text).filter(Boolean) ?? [];

  if (boneQuestions.length === 0) {
    return [`${category.name} hakkında tavsiye arıyorum`];
  }
  return boneQuestions;
}

async function runReplyLoop(
  topic: TopicContext,
  generateForumReply: typeof import("../src/lib/ai/forum-reply-generator").generateForumReply
) {
  activeReplyLoops++;
  const replyCount = randomBetween(replyMin, replyMax);
  const previousReplies: string[] = [];

  try {
    log(
      `[${topic.slug}] Cevap döngüsü başladı · ${replyCount} cevap planlandı`
    );

    for (let i = 0; i < replyCount; i++) {
      await sleep(replyDelayMs);

      const replier = withProxy(createRandomForumAccount());
      await registerOnForum(replier);

      const reply = await generateForumReply({
        category: topic.category,
        city: topic.city,
        topicTitle: topic.title,
        topicBody: topic.body,
        previousReplies,
        replyIndex: i,
        totalReplies: replyCount,
      });

      await postReply(replier, topic.id, reply.body);
      previousReplies.push(reply.body);
      log(`[${topic.slug}] Cevap ${i + 1}/${replyCount}: ${replier.fullName}`);
    }

    log(`[${topic.slug}] Tamamlandı (${replyCount} cevap)`);

    const { notifyForumTopicIndexNow } = await import(
      "../src/lib/indexnow/submit"
    );
    notifyForumTopicIndexNow(topic.slug);
  } catch (err) {
    log(
      `[${topic.slug}] Cevap hatası: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    activeReplyLoops--;
  }
}

async function spawnTopic(
  db: SupabaseClient,
  categories: CategoryRow[],
  generateForumQuestions: typeof import("../src/lib/ai/forum-question-generator").generateForumQuestions,
  generateForumReply: typeof import("../src/lib/ai/forum-reply-generator").generateForumReply
) {
  const asker = withProxy(createRandomForumAccount());
  await registerOnForum(asker);

  const category = pickRandom(categories);
  const city = pickRandom(TURKISH_CITIES) as string;
  const boneQuestions = await pickBoneQuestions(db, category);

  const questions = await generateForumQuestions({
    category: category.name,
    city,
    boneQuestions,
    count: 1,
  });

  const q = questions[0]!;
  const { supabase: askerClient, session: askerSession } = await signIn(asker);

  let topicRow: { id: string; slug: string; title: string };

  try {
    const topicResult = await apiPost(
      "/api/forum/topics",
      {
        title: q.title,
        body: q.body,
        category: category.name,
        city,
      },
      askerSession.access_token,
      asker.proxy
    );
    topicRow = topicResult.topic as { id: string; slug: string; title: string };
  } catch {
    topicRow = await createTopic(askerClient, askerSession.user.id, {
      title: q.title,
      body: q.body,
      category: category.name,
      city,
      authorName: asker.fullName,
      sourceQuestion: q.sourceQuestion,
    });
  }

  const topic: TopicContext = {
    id: topicRow.id,
    slug: topicRow.slug,
    title: q.title,
    body: q.body,
    category: category.name,
    city,
  };

  log(
    `Konu açıldı: ${baseUrl}/t/${topic.slug} · ${asker.fullName} · ${category.name}/${city}`
  );

  const { notifyForumTopicIndexNow } = await import(
    "../src/lib/indexnow/submit"
  );
  notifyForumTopicIndexNow(topic.slug);

  void runReplyLoop(topic, generateForumReply);
}

async function runTopicWave() {
  const { generateForumQuestions } = await import(
    "../src/lib/ai/forum-question-generator"
  );
  const { generateForumReply } = await import(
    "../src/lib/ai/forum-reply-generator"
  );
  const { processPendingCampaignForumReplies } = await import(
    "../src/lib/forum/reply-to-campaign-topics"
  );

  const db = getAdminDb();
  const { data: categories } = await db.from("categories").select("id, name");
  if (!categories?.length) throw new Error("Kategori bulunamadı");

  const campaignReplies = await processPendingCampaignForumReplies();
  if (campaignReplies > 0) {
    log(`Kampanya konularına cevap verildi: ${campaignReplies} konu`);
  }

  log(
    `Dalga başlıyor: ${topicsPerWave} konu · ${formatWait(topicStaggerMs)} arayla · aktif cevap döngüsü: ${activeReplyLoops}`
  );

  for (let i = 0; i < topicsPerWave; i++) {
    void spawnTopic(db, categories, generateForumQuestions, generateForumReply).catch(
      (err) => {
        log(`Konu hatası: ${err instanceof Error ? err.message : String(err)}`);
      }
    );

    if (i < topicsPerWave - 1) {
      await sleep(topicStaggerMs);
    }
  }

  log(`Dalga konu açma tamamlandı (${topicsPerWave} konu kuyruğa alındı)`);
}

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY gerekli");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY gerekli");
  }

  log(`Forum bot başladı · ${baseUrl}`);
  log(
    `Mod: ${topicsPerWave} konu / ${formatWait(waveIntervalMs)} · konu aralığı ${formatWait(topicStaggerMs)} · cevap aralığı ${formatWait(replyDelayMs)}`
  );

  if (proxyPool.length > 0) {
    log(`Proxy havuzu: ${proxyPool.length} adet`);
  }

  if (!daemonMode) {
    await runTopicWave();
    await sleep(60_000);
    return;
  }

  while (true) {
    try {
      await runTopicWave();
    } catch (err) {
      log(`Dalga hatası: ${err instanceof Error ? err.message : String(err)}`);
    }

    log(`Sonraki dalga ${formatWait(waveIntervalMs)} sonra...`);
    await sleep(waveIntervalMs);
  }
}

let shuttingDown = false;

process.on("SIGINT", () => {
  if (shuttingDown) process.exit(0);
  shuttingDown = true;
  log("Kapatılıyor...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  process.exit(0);
});

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
