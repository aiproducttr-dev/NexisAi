/** Punycode for nexısai.com (Turkish dotless ı) */
export const APP_DOMAIN = "xn--nexsai-r9a.com";
export const APP_DOMAIN_WWW = "www.xn--nexsai-r9a.com";
export const APP_DOMAIN_UNICODE = "nexısai.com";
export const SUPPORT_EMAIL = `support@${APP_DOMAIN_UNICODE}`;
/** Vercel canonical host is www — apex 308s to www and strips Authorization on worker calls. */
export const APP_URL = "https://www.xn--nexsai-r9a.com";
export const APP_URL_WWW = APP_URL;

export const APP_HOSTS = [
  APP_DOMAIN,
  APP_DOMAIN_WWW,
  APP_DOMAIN_UNICODE,
  `www.${APP_DOMAIN_UNICODE}`,
];

export const FORUM_DOMAIN = "nexisaiform.com";
export const FORUM_HOSTS = [FORUM_DOMAIN, `www.${FORUM_DOMAIN}`];
export const FORUM_URL = "https://nexisaiform.com";

export function getForumBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FORUM_URL) {
    const url = process.env.NEXT_PUBLIC_FORUM_URL.replace(/\/$/, "");
    if (!url.includes("localhost")) return url;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/forum";
  }
  return FORUM_URL;
}

/** Production resolves to Vercel canonical www host. */
export function getAppBaseUrl(): string {
  if (process.env.NODE_ENV === "development") {
    const local = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (local?.includes("localhost")) return local;
    return "http://localhost:3000";
  }
  return APP_URL;
}

export function forumTopicUrl(slug: string): string {
  return `${getForumBaseUrl()}/t/${slug}`;
}

export function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase();
}

export function isForumHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return FORUM_HOSTS.includes(normalized);
}

export function isAppHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return APP_HOSTS.some((h) => h.toLowerCase() === normalized);
}
