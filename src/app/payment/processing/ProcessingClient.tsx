"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkoutId");
  const [message, setMessage] = useState("Ödemeniz doğrulanıyor…");

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/payment/failure?reason=missing_checkout");
      return;
    }

    let attempts = 0;
    const maxAttempts = 150;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

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
          router.replace(`/dashboard?created=${data.slug}`);
          return;
        }

        if (data.status === "failed") {
          router.replace(`/payment/failure?checkoutId=${checkoutId}`);
          return;
        }

        if (data.status === "processing") {
          setMessage(
            attempts > 15
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
    </div>
  );
}
