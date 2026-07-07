import { FORUM_DOMAIN, FORUM_URL } from "@/lib/constants/urls";

export const INDEXNOW_KEY = "7f4a9c2e8b1d6f3a5c9e2b7d4f8a1c3";

export interface IndexNowConfig {
  key: string;
  host: string;
  keyLocation: string;
}

export function getIndexNowConfig(): IndexNowConfig | null {
  const key = (process.env.INDEXNOW_KEY || INDEXNOW_KEY).trim();
  if (!key) return null;

  return {
    key,
    host: FORUM_DOMAIN,
    keyLocation: `${FORUM_URL}/${key}.txt`,
  };
}

export function isIndexNowKeyPath(pathname: string): boolean {
  return /^\/[a-f0-9]{8,128}\.txt$/i.test(pathname);
}
