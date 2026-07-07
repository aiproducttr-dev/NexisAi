import { getIndexNowConfig } from "@/lib/indexnow/config";
import { forumTopicUrl } from "@/lib/constants/urls";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

export async function submitIndexNowUrls(urls: string[]): Promise<boolean> {
  const config = getIndexNowConfig();
  if (!config || urls.length === 0) return false;

  const uniqueUrls = [...new Set(urls.map((url) => url.trim()))].filter(Boolean);
  if (uniqueUrls.length === 0) return false;

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueUrls.length; i += MAX_URLS_PER_REQUEST) {
    chunks.push(uniqueUrls.slice(i, i + MAX_URLS_PER_REQUEST));
  }

  let ok = true;

  for (const urlList of chunks) {
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          host: config.host,
          key: config.key,
          keyLocation: config.keyLocation,
          urlList,
        }),
      });

      if (!response.ok && response.status !== 202) {
        const body = await response.text();
        console.error(
          `IndexNow hatası (${response.status}): ${body.slice(0, 200)}`,
        );
        ok = false;
      }
    } catch (error) {
      console.error("IndexNow isteği başarısız:", error);
      ok = false;
    }
  }

  return ok;
}

export function notifyForumTopicIndexNow(slug: string): void {
  const url = forumTopicUrl(slug);
  void submitIndexNowUrls([url]).catch((error) => {
    console.error("IndexNow forum bildirimi hatası:", error);
  });
}

export function notifyForumTopicsIndexNow(slugs: string[]): void {
  const urls = slugs.map((slug) => forumTopicUrl(slug));
  void submitIndexNowUrls(urls).catch((error) => {
    console.error("IndexNow forum toplu bildirimi hatası:", error);
  });
}
