"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { trackMetaPurchaseOnce } from "@/lib/analytics/meta-pixel";
import { clearCampaignDraft } from "@/lib/campaign/draft";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkoutId");

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/payment/failure?reason=missing_checkout");
      return;
    }

    let attempts = 0;
    const maxAttempts = 60;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let purchaseTracked = false;

    const trackPaidPurchase = (data: {
      value?: number;
      currency?: string;
      contentName?: string;
      slug?: string;
    }) => {
      clearCampaignDraft();
      if (purchaseTracked) return;
      if (!data.value || Number(data.value) <= 0) return;

      purchaseTracked = true;
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

    const goToDashboard = (data: {
      status: string;
      slug?: string;
      value?: number;
      currency?: string;
      contentName?: string;
    }) => {
      // Ödeme doğrulandı → Purchase (ödeme tamamlandı)
      trackPaidPurchase(data);

      if (data.status === "completed" && data.slug) {
        router.replace(`/dashboard?created=${data.slug}`);
        return;
      }

      router.replace(`/dashboard?checkoutId=${checkoutId}`);
    };

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await fetch(
          `/api/payments/iyzico/status?checkoutId=${checkoutId}`,
          { cache: "no-store" },
        );
        const data = await res.json();

        if (
          res.ok &&
          (data.status === "completed" || data.status === "fulfilling")
        ) {
          goToDashboard(data);
          return;
        }

        if (data.status === "failed") {
          router.replace(`/payment/failure?checkoutId=${checkoutId}`);
          return;
        }

        if (attempts >= maxAttempts) {
          router.replace(`/dashboard?checkoutId=${checkoutId}`);
          return;
        }

        pollTimer = setTimeout(poll, 2000);
      } catch {
        if (attempts >= maxAttempts) {
          router.replace(`/dashboard?checkoutId=${checkoutId}`);
          return;
        }

        pollTimer = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [checkoutId, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan-400" />
      <h1 className="lf-orbitron mb-2 text-2xl font-bold text-white">
        Ödemeniz doğrulanıyor
      </h1>
      <p className="max-w-md text-sm text-[#94a3b8]">
        Birkaç saniye içinde yönetim paneline yönlendirileceksiniz…
      </p>
    </div>
  );
}
