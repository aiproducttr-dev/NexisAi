"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { trackMetaPurchaseOnce } from "@/lib/analytics/meta-pixel";

export default function CheckoutFulfillmentTracker({
  checkoutId,
}: {
  checkoutId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const maxAttempts = 180;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await fetch(
          `/api/payments/iyzico/status?checkoutId=${checkoutId}`,
          { cache: "no-store" },
        );
        const data = await res.json();

        if (res.ok && data.status === "completed" && data.slug) {
          if (data.value && checkoutId) {
            trackMetaPurchaseOnce(
              checkoutId,
              {
                value: Number(data.value),
                currency: data.currency ?? "TRY",
                checkoutId,
                contentName: data.contentName,
              },
              [data.slug],
            );
          }

          router.replace(`/dashboard?created=${data.slug}`);
          return;
        }

        if (data.status === "failed") {
          router.replace(`/payment/failure?checkoutId=${checkoutId}`);
          return;
        }

        if (attempts >= maxAttempts) {
          return;
        }

        pollTimer = setTimeout(poll, 3000);
      } catch {
        if (attempts >= maxAttempts) return;
        pollTimer = setTimeout(poll, 5000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [checkoutId, router]);

  return (
    <div className="lf-animate-in lf-animate-in-1 lf-card-border mb-8 rounded-[20px] p-[2px]">
      <div className="lf-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            İçerik yayınlanması bekleniyor
          </p>
          <h2 className="lf-orbitron mt-1 text-lg font-bold text-white sm:text-xl">
            İşleminiz devam ediyor
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
            Ödemeniz alındı ve doğrulandı. Kampanyanız oluşturuluyor, içerikler
            yayınlanıyor… Bu işlem birkaç dakika sürebilir; sayfayı
            kapatabilirsiniz, tamamlandığında burada görünecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
