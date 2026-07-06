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
  return "http://localhost:3000";
}

export function forumTopicUrl(slug: string): string {
  return `${getForumBaseUrl()}/t/${slug}`;
}

export function isForumHost(host: string): boolean {
  const normalized = host.split(":")[0].toLowerCase();
  return FORUM_HOSTS.includes(normalized);
}
