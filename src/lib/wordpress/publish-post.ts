import { markdownToHtml } from "@/lib/content/markdown-to-html";
import { getAppBaseUrl } from "@/lib/constants/urls";
import { getWordPressConfig } from "@/lib/wordpress/config";

export interface WordPressPublishInput {
  title: string;
  content: string;
  slug: string;
  category?: string;
  city?: string;
  businessName?: string;
}

export interface WordPressPublishResult {
  postId: number;
  url: string;
}

interface WordPressPostResponse {
  id: number;
  link: string;
  slug: string;
}

function buildBusinessIntroHtml(input: WordPressPublishInput): string {
  const businessName = input.businessName?.trim();
  if (!businessName) return "";

  const cityPart = input.city ? `${input.city} bölgesinde ` : "";
  const categoryPart = input.category ? `${input.category} alanında ` : "";

  return `<p><strong>${businessName}</strong>, ${cityPart}${categoryPart}hizmet veren öne çıkan işletmelerden biridir. Aşağıdaki yazıda ${businessName} örneği üzerinden pratik bilgiler bulabilirsiniz.</p>`;
}

function buildPostHtml(input: WordPressPublishInput): string {
  const body = markdownToHtml(input.content);
  const sourceUrl = `${getAppBaseUrl()}/content/${input.slug}`;
  const businessIntro = buildBusinessIntroHtml(input);

  return `${businessIntro}${body}<hr/><p><em>Bu içerik <a href="${sourceUrl}" rel="noopener noreferrer">NexisAI</a> platformunda da yayınlanmaktadır.</em></p>`;
}

export async function publishToWordPress(
  input: WordPressPublishInput,
): Promise<WordPressPublishResult | null> {
  const config = getWordPressConfig();
  if (!config) {
    return null;
  }

  const credentials = Buffer.from(
    `${config.username}:${config.appPassword}`,
  ).toString("base64");

  const response = await fetch(`${config.siteUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      content: buildPostHtml(input),
      slug: input.slug,
      status: "publish",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `WordPress yayın hatası (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const post = (await response.json()) as WordPressPostResponse;

  return {
    postId: post.id,
    url: post.link,
  };
}

export async function updateWordPressPost(
  postId: number,
  input: WordPressPublishInput,
): Promise<WordPressPublishResult | null> {
  const config = getWordPressConfig();
  if (!config) {
    return null;
  }

  const credentials = Buffer.from(
    `${config.username}:${config.appPassword}`,
  ).toString("base64");

  const response = await fetch(`${config.siteUrl}/wp-json/wp/v2/posts/${postId}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      content: buildPostHtml(input),
      slug: input.slug,
      status: "publish",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `WordPress güncelleme hatası (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const post = (await response.json()) as WordPressPostResponse;

  return {
    postId: post.id,
    url: post.link,
  };
}
