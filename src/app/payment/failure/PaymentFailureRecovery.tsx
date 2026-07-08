"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentFailureRecovery({
  checkoutId,
}: {
  checkoutId?: string;
}) {
  const [storedCheckoutId, setStoredCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("nexisai_checkout_id");
    if (saved) setStoredCheckoutId(saved);
  }, []);

  const recoveryId = checkoutId || storedCheckoutId;
  if (!recoveryId) return null;

  return (
    <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
      <p className="mb-3">
        Kartınızdan çekim yapıldıysa ödeme iyzico tarafında tamamlanmış olabilir.
        Kampanyanızı başlatmak için aşağıdaki bağlantıyı kullanın.
      </p>
      <Link
        href={`/payment/processing?checkoutId=${recoveryId}`}
        className="lf-btn-primary inline-block rounded-xl px-5 py-2.5 font-semibold text-white"
      >
        Ödemeyi Doğrula ve Devam Et
      </Link>
    </div>
  );
}
