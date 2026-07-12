"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { trackMetaPurchaseOnce } from "@/lib/analytics/meta-pixel";
import { clearCampaignDraft } from "@/lib/campaign/draft";

export default function CheckoutFulfillmentTracker({
  checkoutId,
}: {
  checkoutId: string;
}) {
  const router = useRouter();
  const purchaseTracked = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const maxAttempts = 120; // ~6 min at 3s

    const trackPaidPurchase = (data: {
      value?: number;
      currency?: string;
      contentName?: string;
      slug?: string;
    }) => {
      clearCampaignDraft();
      if (purchaseTracked.current) return;
      if (!data.value || Number(data.value) <= 0) return;

      purchaseTracked.current = true;
      trackMetaPurchaseOnce(
        checkoutId,
        {
          value: Number(data.value),
          currency: data.currency ?? "TRY",
          checkoutId,
          contentName: data.contentName,
        },
        data.slug ? [data.slug] : [],
      );
    };

    const startFulfillment = async () => {
      try {
        const res = await fetch("/api/payments/iyzico/start-fulfillment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId }),
        });

        if (cancelled) return null;

        const data = await res.json();

        if (res.status === 401) {
          router.replace(
            `/auth?mode=login&redirect=${encodeURIComponent(`/dashboard?checkoutId=${checkoutId}`)}`,
          );
          return null;
        }

        if (res.ok && (data.status === "completed" || data.status === "fulfilling")) {
          trackPaidPurchase(data);
        }

        if (res.ok && data.status === "completed" && data.slug) {
          router.replace(`/dashboard?created=${data.slug}`);
          return "done";
        }

        return data.status as string | undefined;
      } catch (error) {
        console.error("Fulfillment start error:", error);
        return null;
      }
    };

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        // Re-kick scheduler periodically in case after()/worker dropped.
        if (attempts === 1 || attempts % 5 === 0) {
          const kick = await startFulfillment();
          if (kick === "done") return;
        }

        const res = await fetch(
          `/api/payments/iyzico/status?checkoutId=${checkoutId}`,
          { cache: "no-store" },
        );
        const data = await res.json();

        if (res.status === 401) {
          router.replace(
            `/auth?mode=login&redirect=${encodeURIComponent(`/dashboard?checkoutId=${checkoutId}`)}`,
          );
          return;
        }

        if (
          res.ok &&
          (data.status === "completed" || data.status === "fulfilling")
        ) {
          trackPaidPurchase(data);
        }

        if (res.ok && data.status === "completed" && data.slug) {
          router.replace(`/dashboard?created=${data.slug}`);
          return;
        }

        if (data.status === "failed") {
          router.replace(`/payment/failure?checkoutId=${checkoutId}`);
          return;
        }

        if (attempts >= maxAttempts) {
          if (!cancelled) setTimedOut(true);
          return;
        }

        pollTimer = setTimeout(poll, 3000);
      } catch {
        if (attempts >= maxAttempts) {
          if (!cancelled) setTimedOut(true);
          return;
        }
        pollTimer = setTimeout(poll, 5000);
      }
    };

    void startFulfillment().then((result) => {
      if (result === "done" || cancelled) return;
      poll();
    });

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [checkoutId, router, retrying]);

  async function handleRetry() {
    setTimedOut(false);
    setRetrying((v) => !v);
  }

  return (
    <div className="lf-animate-in lf-animate-in-1 lf-card-border mb-8 rounded-[20px] p-[2px]">
      <div className="lf-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
          {timedOut ? (
            <span className="text-lg text-amber-300">!</span>
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            {timedOut
              ? "Kampanya hazırlığı gecikti"
              : "İçerik yayınlanması bekleniyor"}
          </p>
          <h2 className="lf-orbitron mt-1 text-lg font-bold text-white sm:text-xl">
            {timedOut ? "Biraz daha bekleyin" : "İşleminiz devam ediyor"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
            {timedOut
              ? "Ödemeniz alındı. İçerik üretimi beklenenden uzun sürdü. Tekrar denersek kampanyanız tamamlanacaktır."
              : "Ödemeniz alındı ve doğrulandı. Kampanyanız oluşturuluyor, içerikler yayınlanıyor… Bu işlem birkaç dakika sürebilir; lütfen bu sekmeyi açık bırakın."}
          </p>
          {timedOut && (
            <button
              type="button"
              onClick={handleRetry}
              className="lf-btn-primary relative mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
