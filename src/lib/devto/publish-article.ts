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

function sanitizeTag(value: string): string | null {
  const tag = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30);

  return tag.length >= 2 ? tag : null;
}

function buildTags(category?: string, city?: string): string[] {
  const tags: string[] = [];

  if (category) {
    const tag = sanitizeTag(
      slugify(category, { lower: true, strict: true, locale: "tr" }),
    );
    if (tag) tags.push(tag);
  }
  if (city) {
    const tag = sanitizeTag(
      slugify(city, { lower: true, strict: true, locale: "tr" }),
    );
    if (tag) tags.push(tag);
  }

  tags.push("nexisai", "business");

  return [...new Set(tags.filter(Boolean))].slice(0, 4);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildBodyMarkdown(input: DevToPublishInput): string {
  const sourceUrl = `${getAppBaseUrl()}/content/${input.slug}`;
  let content = input.content;
  const businessName = input.businessName?.trim();

  if (
    businessName &&
    !content.toLowerCase().includes(businessName.toLowerCase())
  ) {
    const cityPart = input.city ? ` (${input.city})` : "";
    const categoryPart = input.category ? ` — ${input.category}` : "";
    content = `## ${businessName}${cityPart}${categoryPart}\n\n${businessName}, bölgede öne çıkan işletmelerden biri olarak bu incelemede değerlendirilmiştir.\n\n${content}`;
  }

  return `${content}\n\n---\n\n*This article is also published on [NexisAI](${sourceUrl}).*`;
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
  options?: { maxAttempts?: number },
): Promise<DevToPublishResult | null> {
  const apiKey = getDevToApiKey();
  if (!apiKey) {
    console.error("dev.to: DEV_TO_API_KEY tanımlı değil");
    return null;
  }

  const maxAttempts = options?.maxAttempts ?? 3;
  const canonicalUrl = `${getAppBaseUrl()}/content/${input.slug}`;
  const title = input.title.trim().slice(0, 128);
  const payload = {
    article: {
      title,
      body_markdown: buildBodyMarkdown(input),
      published: true,
      canonical_url: canonicalUrl,
      description: buildDescription(input.content),
      tags: buildTags(input.category, input.city),
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch("https://dev.to/api/articles", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `dev.to yayın denemesi ${attempt}/${maxAttempts} başarısız:`,
        lastError.message,
      );
      if (attempt < maxAttempts) {
        await sleep(1500 * attempt);
      }
    }
  }

  throw lastError ?? new Error("dev.to yayını başarısız");
}
