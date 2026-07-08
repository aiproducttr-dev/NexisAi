import Link from "next/link";

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ checkoutId?: string; reason?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="lf-orbitron mb-3 text-2xl font-bold text-white">
        Ödeme tamamlanamadı
      </h1>
      <p className="mb-6 text-sm text-[#94a3b8]">
        {params.reason === "timeout"
          ? "Ödeme alındı ancak kampanya oluşturma uzun sürdü. Destek ile iletişime geçin veya tekrar deneyin."
          : "Ödeme işlemi iptal edildi veya başarısız oldu. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz."}
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard/new"
          className="lf-btn-primary rounded-xl px-6 py-3 font-semibold text-white"
        >
          Tekrar Dene
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 px-6 py-3 text-[#94a3b8]"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
