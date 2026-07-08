import { Suspense } from "react";
import PaymentProcessingClient from "./ProcessingClient";

export default function PaymentProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-[#94a3b8]">
          Yükleniyor…
        </div>
      }
    >
      <PaymentProcessingClient />
    </Suspense>
  );
}
