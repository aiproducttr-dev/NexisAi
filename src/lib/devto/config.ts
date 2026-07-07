export function getDevToApiKey(): string | null {
  const apiKey = process.env.DEV_TO_API_KEY?.trim();
  return apiKey || null;
}

export function isDevToEnabled(): boolean {
  return getDevToApiKey() !== null;
}
