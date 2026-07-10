export const META_PIXEL_ID = "1791339435183782";

type FbqFn = (
  command: "track" | "trackCustom" | "init",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as Window & { fbq?: FbqFn }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const fbq = getFbq();
  if (!fbq) return;

  if (params) {
    fbq("track", eventName, params);
    return;
  }

  fbq("track", eventName);
}

export interface MetaPurchaseParams {
  value: number;
  currency?: string;
  checkoutId?: string;
  contentName?: string;
}

function purchaseStorageKey(key: string) {
  return `meta_purchase_${key}`;
}

export function isMetaPurchaseTracked(key: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(purchaseStorageKey(key)) === "1";
}

export function markMetaPurchaseTracked(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(purchaseStorageKey(key), "1");
}

/** Meta standard: kayıt tamamlandı */
export function trackMetaCompleteRegistration() {
  trackEvent("CompleteRegistration", {
    content_name: "NexisAI Hesap",
    status: true,
  });
}

/** Meta standard: ödeme sayfasına yönlendirme */
export function trackMetaInitiateCheckout(params: {
  value: number;
  currency?: string;
  contentName?: string;
  checkoutId?: string;
}) {
  trackEvent("InitiateCheckout", {
    value: params.value,
    currency: params.currency ?? "TRY",
    content_type: "product",
    content_name: params.contentName ?? "NexisAI Kampanya",
    content_ids: params.checkoutId ? [params.checkoutId] : undefined,
    num_items: 1,
  });
}

/** Meta standard: ödeme tamamlandı */
export function trackMetaPurchase(params: MetaPurchaseParams) {
  trackEvent("Purchase", {
    value: params.value,
    currency: params.currency ?? "TRY",
    content_type: "product",
    content_name: params.contentName ?? "NexisAI Kampanya",
    content_ids: params.checkoutId ? [params.checkoutId] : undefined,
    order_id: params.checkoutId,
  });
}

export function trackMetaPurchaseOnce(
  dedupeKey: string,
  params: MetaPurchaseParams,
  extraDedupeKeys: string[] = [],
) {
  const keys = [dedupeKey, ...extraDedupeKeys];
  if (keys.some((key) => isMetaPurchaseTracked(key))) return;

  trackMetaPurchase(params);

  for (const key of keys) {
    markMetaPurchaseTracked(key);
  }
}
