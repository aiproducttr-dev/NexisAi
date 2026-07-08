import { calculateVisibilityMetrics } from "@/lib/constants/metrics";
import { getAppBaseUrl } from "@/lib/constants/urls";
import type { CampaignInput } from "@/lib/campaign/validate-input";
import { getIyzipayClient } from "@/lib/iyzico/client";

export interface CheckoutBuyer {
  id: string;
  email: string;
  fullName: string | null;
  ip: string;
}

function splitName(fullName: string | null, fallback: string): {
  name: string;
  surname: string;
} {
  const source = (fullName || fallback).trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { name: "NexisAI", surname: "Kullanici" };
  }

  if (parts.length === 1) {
    return { name: parts[0]!, surname: "Kullanici" };
  }

  return {
    name: parts[0]!,
    surname: parts.slice(1).join(" "),
  };
}

function formatPrice(amount: number): string {
  return amount.toFixed(2);
}

export function buildCheckoutInitializeRequest(
  checkoutId: string,
  input: CampaignInput,
  buyer: CheckoutBuyer,
) {
  const client = getIyzipayClient();
  const metrics = calculateVisibilityMetrics(input.dailyBudget, input.days);
  const { name, surname } = splitName(buyer.fullName, input.businessName);
  const address = `${input.city}, Turkiye`;

  return {
    locale: client.LOCALE.TR,
    conversationId: checkoutId,
    price: formatPrice(metrics.totalCost),
    paidPrice: formatPrice(metrics.totalCost),
    currency: client.CURRENCY.TRY,
    basketId: checkoutId,
    paymentGroup: client.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${getAppBaseUrl()}/api/payments/iyzico/callback`,
    enabledInstallments: [1],
    buyer: {
      id: buyer.id,
      name,
      surname,
      gsmNumber: "+905555555555",
      email: buyer.email,
      identityNumber: "11111111111",
      lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      registrationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      registrationAddress: address,
      ip: buyer.ip,
      city: input.city,
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: `${name} ${surname}`,
      city: input.city,
      country: "Turkey",
      address,
      zipCode: "34000",
    },
    billingAddress: {
      contactName: `${name} ${surname}`,
      city: input.city,
      country: "Turkey",
      address,
      zipCode: "34000",
    },
    basketItems: [
      {
        id: checkoutId,
        name: `NexisAI Kampanya - ${input.businessName}`,
        category1: input.category,
        category2: input.city,
        itemType: client.BASKET_ITEM_TYPE.VIRTUAL,
        price: formatPrice(metrics.totalCost),
      },
    ],
  };
}
