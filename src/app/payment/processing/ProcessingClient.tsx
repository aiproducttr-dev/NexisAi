"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { trackMetaPurchaseOnce } from "@/lib/analytics/meta-pixel";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkoutId");
  const [message, setMessage] = useState("Ödemeniz doğrulanıyor…");
  const [showManualLink, setShowManualLink] = useState(false);

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/payment/failure?reason=missing_checkout");
      return;
    }

    let attempts = 0;
    const maxAttempts = 180;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      if (attempts === 20) {
        setShowManualLink(true);
      }

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

        if (data.status === "processing") {
          setMessage(
            attempts > 10
              ? "Kampanyanız oluşturuluyor, içerikler yayınlanıyor… Bu işlem birkaç dakika sürebilir."
              : "Kampanyanız oluşturuluyor, içerikler yayınlanıyor…",
          );
        } else if (data.status === "pending_payment") {
          setMessage("Ödeme doğrulanıyor…");
        } else if (!res.ok) {
          setMessage("Bağlantı kontrol ediliyor, lütfen bekleyin…");
        }

        if (attempts >= maxAttempts) {
          router.replace(
            `/payment/failure?checkoutId=${checkoutId}&reason=timeout`,
          );
          return;
        }

        const delay = data.status === "processing" ? 3000 : 2000;
        pollTimer = setTimeout(poll, delay);
      } catch {
        if (attempts >= maxAttempts) {
          router.replace(
            `/payment/failure?checkoutId=${checkoutId}&reason=network`,
          );
          return;
        }

        setMessage("Bağlantı kontrol ediliyor, lütfen bekleyin…");
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
        İşleminiz devam ediyor
      </h1>
      <p className="max-w-md text-sm text-[#94a3b8]">{message}</p>
      {showManualLink && checkoutId && (
        <div className="mt-6 max-w-md rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          <p className="mb-3">
            İşlem arka planda devam ediyor. Birkaç dakika sonra dashboard&apos;da
            kampanyanızı görebilirsiniz.
          </p>
          <Link
            href={`/dashboard`}
            className="lf-btn-primary inline-block rounded-xl px-5 py-2.5 font-semibold text-white"
          >
            Dashboard&apos;a Git
          </Link>
        </div>
      )}
    </div>
  );
}
