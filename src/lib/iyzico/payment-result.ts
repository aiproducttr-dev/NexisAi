import type { IyzipayResponse } from "@/lib/iyzico/client";

export function isPaymentSuccessful(payment: IyzipayResponse): boolean {
  if (payment.status !== "success") return false;

  const paymentStatus = (payment.paymentStatus || "").toUpperCase();
  if (paymentStatus === "SUCCESS") return true;
  if (paymentStatus === "FAILURE") return false;

  // Bazı başarılı ödemelerde yalnızca paymentId döner
  if (payment.paymentId) return true;

  return false;
}

export function isPaymentFailed(payment: IyzipayResponse): boolean {
  if (payment.status === "failure") return true;
  return (payment.paymentStatus || "").toUpperCase() === "FAILURE";
}
