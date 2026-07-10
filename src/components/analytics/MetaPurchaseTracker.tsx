"use client";

import {
  isMetaPurchaseTracked,
  markMetaPurchaseTracked,
  trackMetaPurchase,
  type MetaPurchaseParams,
} from "@/lib/analytics/meta-pixel";
import { useEffect } from "react";

interface MetaPurchaseTrackerProps extends MetaPurchaseParams {
  dedupeKey: string;
}

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

    trackMetaPurchase({
      value,
      currency,
      checkoutId,
      contentName,
    });
    markMetaPurchaseTracked(dedupeKey);
  }, [dedupeKey, value, currency, checkoutId, contentName]);

  return null;
}
