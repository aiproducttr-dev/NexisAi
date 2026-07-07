export interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export function getWordPressConfig(): WordPressConfig | null {
  const siteUrl = process.env.WORDPRESS_SITE_URL?.replace(/\/$/, "");
  const username = process.env.WORDPRESS_USERNAME?.trim();
  const appPassword = process.env.WORDPRESS_APP_PASSWORD?.replace(/\s/g, "");

  if (!siteUrl || !username || !appPassword) {
    return null;
  }

  return { siteUrl, username, appPassword };
}

export function isWordPressEnabled(): boolean {
  return getWordPressConfig() !== null;
}
