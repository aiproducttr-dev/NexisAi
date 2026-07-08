import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme | NexisAI",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030014] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
