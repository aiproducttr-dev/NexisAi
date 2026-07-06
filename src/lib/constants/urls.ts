/** Punycode for nexısai.com (Turkish dotless ı) */
export const APP_DOMAIN = "xn--nexsai-r9a.com";
export const APP_DOMAIN_UNICODE = "nexısai.com";
export const APP_URL = `https://${APP_DOMAIN}`;

export const APP_HOSTS = [
  APP_DOMAIN,
  `www.${APP_DOMAIN}`,
  APP_DOMAIN_UNICODE,
  `www.${APP_DOMAIN_UNICODE}`,
];

export const FORUM_DOMAIN = "nexisaiform.com";
export const FORUM_HOSTS = [FORUM_DOMAIN, `www.${FORUM_DOMAIN}`];

export function getForumBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FORUM_URL) {
    return process.env.NEXT_PUBLIC_FORUM_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/forum";
  }
  return `https://${FORUM_DOMAIN}`;
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return APP_URL;
  }
  return "http://localhost:3000";
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
  return APP_HOSTS.some(
    (h) => h.toLowerCase() === normalized
  );
}
