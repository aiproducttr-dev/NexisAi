export const APP_HOSTS = ["nexisai.com", "www.nexisai.com"];
export const FORUM_HOSTS = ["nexisaiform.com", "www.nexisaiform.com"];

export function getForumBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FORUM_URL) {
    return process.env.NEXT_PUBLIC_FORUM_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/forum";
  }
  return "https://nexisaiform.com";
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://nexisai.com";
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
  return FORUM_HOSTS.includes(normalizeHost(host));
}

export function isAppHost(host: string): boolean {
  return APP_HOSTS.includes(normalizeHost(host));
}
