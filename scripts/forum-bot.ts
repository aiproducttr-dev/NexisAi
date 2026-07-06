/**
 * NexisAI Form forum bot — sürekli çalışan organik soru + cevap simülasyonu.
 *
 * Tek döngü:  npm run forum-bot
 * Sürekli:    npm run forum-bot:daemon
 *
 * Ortam (.env.local):
 *   FORUM_BOT_BASE_URL=https://nexisaiform.com
 *   FORUM_BOT_INTERVAL_MIN_MS=1800000   (varsayılan 30 dk)
 *   FORUM_BOT_INTERVAL_MAX_MS=5400000   (varsayılan 90 dk)
 *   FORUM_BOT_PROXIES=http://...,socks5://...  (virgülle ayrılmış TR proxy)
 *   FORUM_BOT_PROXIES_FILE=/path/forum-bot-proxies.txt
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

const intervalMinMs = Number(process.env.FORUM_BOT_INTERVAL_MIN_MS || 30 * 60 * 1000);
const intervalMaxMs = Number(process.env.FORUM_BOT_INTERVAL_MAX_MS || 90 * 60 * 1000);
const firstReplyDelayMinMs = Number(
  process.env.FORUM_BOT_FIRST_REPLY_DELAY_MIN_MS || 8 * 60 * 1000
);
const firstReplyDelayMaxMs = Number(
  process.env.FORUM_BOT_FIRST_REPLY_DELAY_MAX_MS || 25 * 60 * 1000
);
const replyDelayMinMs = Number(
  process.env.FORUM_BOT_REPLY_DELAY_MIN_MS || 5 * 60 * 1000
);
const replyDelayMaxMs = Number(
  process.env.FORUM_BOT_REPLY_DELAY_MAX_MS || 18 * 60 * 1000
);
const typingDelayMinMs = Number(process.env.FORUM_BOT_TYPING_DELAY_MIN_MS || 8000);
const typingDelayMaxMs = Number(process.env.FORUM_BOT_TYPING_DELAY_MAX_MS || 45000);
const daemonMode = process.argv.includes("--daemon");
const proxyPool = loadProxyList();

interface BotAccount {
  email: string;
  password: string;
  fullName: string;
  proxy?: string;
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

function log(message: string) {
  const time = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
  console.log(`[${time}] ${message}`);
}

async function registerOnForum(account: BotAccount): Promise<void> {
  const proxiedFetch = createProxiedFetch(account.proxy);
  const ip = await resolveOutboundIp(account.proxy);

  const res = await proxiedFetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
      fullName: account.fullName,
    }),
  });

  if (res.ok) {
    log(
      `Kayıt: ${account.fullName} (${account.email}) · IP: ${ip ?? "?"} · ${maskProxy(account.proxy)}`
    );
    return;
  }

  const data = (await res.json()) as { error?: string };
  if (res.status === 409) {
    log(`Zaten kayıtlı: ${account.fullName}`);
    return;
  }

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

async function runCycle() {
  const { generateForumQuestions } = await import(
    "../src/lib/ai/forum-question-generator"
  );
  const { generateForumReply } = await import(
    "../src/lib/ai/forum-reply-generator"
  );

  const asker = withProxy(createRandomForumAccount());
  const replyCount = randomBetween(4, 10);
  const repliers = Array.from({ length: replyCount }, () =>
    withProxy(createRandomForumAccount())
  );

  log(
    `Yeni üyeler: ${asker.fullName} → soru, ${replyCount} cevaplayan (${repliers.map((r) => r.fullName).join(", ")})`
  );

  await registerOnForum(asker);
  await sleep(randomBetween(800, 2000));

  for (const replier of repliers) {
    await registerOnForum(replier);
    await sleep(randomBetween(600, 1800));
  }
  await sleep(randomBetween(500, 1200));

  const admin = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const db = admin ?? createClient(supabaseUrl, supabaseAnonKey);

  const { data: categories } = await db.from("categories").select("id, name");
  if (!categories?.length) throw new Error("Kategori bulunamadı");

  const category = pickRandom(categories);
  const city = pickRandom(TURKISH_CITIES) as string;

  const { data: boneRows } = await db
    .from("bone_questions")
    .select("question_text")
    .eq("category_id", category.id)
    .limit(50);

  const boneQuestions =
    boneRows?.map((r) => r.question_text).filter(Boolean) ?? [];
  if (boneQuestions.length === 0) {
    throw new Error(`"${category.name}" için kemik soru yok`);
  }

  log(`Kategori: ${category.name} · Şehir: ${city}`);

  const questions = await generateForumQuestions({
    category: category.name,
    city,
    boneQuestions,
    count: 1,
  });

  const q = questions[0]!;
  log(`Soru: ${q.title} (${asker.fullName})`);

  const { supabase: askerClient, session: askerSession } = await signIn(asker);
  await sleep(randomBetween(1200, 3000));

  let topic: { id: string; slug: string; title: string };

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
    topic = topicResult.topic as { id: string; slug: string; title: string };
  } catch {
    topic = await createTopic(askerClient, askerSession.user.id, {
      title: q.title,
      body: q.body,
      category: category.name,
      city,
      authorName: asker.fullName,
      sourceQuestion: q.sourceQuestion,
    });
  }

  log(`Konu açıldı: ${baseUrl}/t/${topic.slug}`);

  const previousReplies: string[] = [];

  for (let i = 0; i < repliers.length; i++) {
    const replier = repliers[i]!;
    const waitMs =
      i === 0
        ? randomBetween(firstReplyDelayMinMs, firstReplyDelayMaxMs)
        : randomBetween(replyDelayMinMs, replyDelayMaxMs);

    log(
      `Cevap ${i + 1}/${replyCount} için bekleniyor (${Math.round(waitMs / 60000)} dk)...`
    );
    await sleep(waitMs);

    const reply = await generateForumReply({
      category: category.name,
      city,
      topicTitle: q.title,
      topicBody: q.body,
      previousReplies,
      replyIndex: i,
      totalReplies: replyCount,
    });

    await sleep(randomBetween(typingDelayMinMs, typingDelayMaxMs));

    await postReply(replier, topic.id, reply.body);
    previousReplies.push(reply.body);
    log(`Cevap ${i + 1}/${replyCount}: ${replier.fullName}`);
  }

  log(`Tamamlandı (${replyCount} cevap): ${baseUrl}/t/${topic.slug}`);
}

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY gerekli");
  }

  log(`Forum bot başladı · ${baseUrl}`);
  if (proxyPool.length > 0) {
    log(`Proxy havuzu: ${proxyPool.length} adet (hesap başına rastgele TR IP)`);
  } else {
    log(
      "Proxy yok — tüm istekler VPS IP'sinden gidiyor. TR proxy için FORUM_BOT_PROXIES ayarlayın."
    );
  }

  if (!daemonMode) {
    await runCycle();
    return;
  }

  log(
    `Daemon modu · döngü aralığı ${Math.round(intervalMinMs / 60000)}-${Math.round(intervalMaxMs / 60000)} dk`
  );

  while (true) {
    try {
      await runCycle();
    } catch (err) {
      log(
        `Döngü hatası: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const waitMs = randomBetween(intervalMinMs, intervalMaxMs);
    log(`Sonraki döngü ${Math.round(waitMs / 60000)} dk sonra...`);
    await sleep(waitMs);
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
