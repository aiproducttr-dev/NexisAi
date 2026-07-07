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

function buildPostHtml(input: WordPressPublishInput): string {
  const body = markdownToHtml(input.content);
  const sourceUrl = `${getAppBaseUrl()}/content/${input.slug}`;

  const metaParts = [input.category, input.city, input.businessName].filter(
    Boolean,
  );

  const metaLine =
    metaParts.length > 0
      ? `<p><strong>${metaParts.join(" · ")}</strong></p>`
      : "";

  return `${metaLine}${body}<hr/><p><em>Bu içerik <a href="${sourceUrl}" rel="noopener noreferrer">NexisAI</a> platformunda da yayınlanmaktadır.</em></p>`;
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
