import { getAppBaseUrl } from "@/lib/constants/urls";
import { getDevToApiKey } from "@/lib/devto/config";
import slugify from "slugify";

export interface DevToPublishInput {
  title: string;
  content: string;
  slug: string;
  category?: string;
  city?: string;
  businessName?: string;
}

export interface DevToPublishResult {
  articleId: number;
  url: string;
}

interface DevToArticleResponse {
  id: number;
  url: string;
}

function buildTags(category?: string, city?: string): string[] {
  const tags: string[] = [];

  if (category) {
    tags.push(
      slugify(category, { lower: true, strict: true, locale: "tr" }).slice(
        0,
        30,
      ),
    );
  }
  if (city) {
    tags.push(
      slugify(city, { lower: true, strict: true, locale: "tr" }).slice(0, 30),
    );
  }

  tags.push("nexisai", "business");

  return [...new Set(tags.filter(Boolean))].slice(0, 4);
}

function buildBodyMarkdown(input: DevToPublishInput): string {
  const sourceUrl = `${getAppBaseUrl()}/content/${input.slug}`;
  const metaParts = [input.category, input.city, input.businessName].filter(
    Boolean,
  );

  const metaLine =
    metaParts.length > 0 ? `**${metaParts.join(" · ")}**\n\n` : "";

  return `${metaLine}${input.content}\n\n---\n\n*This article is also published on [NexisAI](${sourceUrl}).*`;
}

function buildDescription(content: string): string {
  const plain = content
    .replace(/[#*_`>\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > 200 ? `${plain.slice(0, 197)}...` : plain;
}

export async function publishToDevTo(
  input: DevToPublishInput,
): Promise<DevToPublishResult | null> {
  const apiKey = getDevToApiKey();
  if (!apiKey) {
    return null;
  }

  const canonicalUrl = `${getAppBaseUrl()}/content/${input.slug}`;

  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      article: {
        title: input.title,
        body_markdown: buildBodyMarkdown(input),
        published: true,
        canonical_url: canonicalUrl,
        description: buildDescription(input.content),
        tags: buildTags(input.category, input.city),
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `dev.to yayın hatası (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const article = (await response.json()) as DevToArticleResponse;

  return {
    articleId: article.id,
    url: article.url,
  };
}
