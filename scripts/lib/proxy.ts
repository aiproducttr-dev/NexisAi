import { ProxyAgent, fetch as undiciFetch } from "undici";
import { readFileSync } from "fs";
import { resolve } from "path";

type FetchFn = typeof fetch;

const proxyCache = new Map<string, FetchFn>();

export function loadProxyList(): string[] {
  const fromEnv = process.env.FORUM_BOT_PROXIES?.split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (fromEnv?.length) return fromEnv;

  const filePath =
    process.env.FORUM_BOT_PROXIES_FILE ||
    resolve(process.cwd(), "forum-bot-proxies.txt");

  try {
    return readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

export function pickRandomProxy(proxies: readonly string[]): string | undefined {
  if (!proxies.length) return undefined;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

export function maskProxy(proxy?: string): string {
  if (!proxy) return "direkt";
  try {
    const url = new URL(proxy);
    if (url.password) url.password = "***";
    if (url.username) url.username = `${url.username.slice(0, 2)}***`;
    return url.toString();
  } catch {
    return "proxy";
  }
}

export function createProxiedFetch(proxyUrl?: string): FetchFn {
  if (!proxyUrl) return fetch;

  const cached = proxyCache.get(proxyUrl);
  if (cached) return cached;

  const agent = new ProxyAgent(proxyUrl);
  const proxiedFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(
      input as Parameters<typeof undiciFetch>[0],
      { ...init, dispatcher: agent }
    )) as FetchFn;

  proxyCache.set(proxyUrl, proxiedFetch);
  return proxiedFetch;
}

export async function resolveOutboundIp(proxyUrl?: string): Promise<string | null> {
  try {
    const proxiedFetch = createProxiedFetch(proxyUrl);
    const res = await proxiedFetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? null;
  } catch {
    return null;
  }
}
