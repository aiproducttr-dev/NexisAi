"use client";

import {
  isMetaPurchaseTracked,
  trackMetaPurchaseOnce,
  type MetaPurchaseParams,
} from "@/lib/analytics/meta-pixel";
import { useEffect } from "react";

interface MetaPurchaseTrackerProps extends MetaPurchaseParams {
  dedupeKey: string;
}

/** Backup Purchase fire on dashboard ?created= (deduped by checkout/slug). */
export default function MetaPurchaseTracker({
  dedupeKey,
  value,
  currency,
  checkoutId,
  contentName,
}: MetaPurchaseTrackerProps) {
  useEffect(() => {
    if (!dedupeKey || !Number.isFinite(value) || value <= 0) return;
    if (isMetaPurchaseTracked(dedupeKey)) return;
    if (checkoutId && isMetaPurchaseTracked(checkoutId)) return;

    trackMetaPurchaseOnce(dedupeKey, {
      value,
      currency,
      checkoutId,
      contentName,
    }, checkoutId ? [checkoutId] : []);
  }, [dedupeKey, value, currency, checkoutId, contentName]);

  return null;
}
