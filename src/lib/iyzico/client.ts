import { createHmac } from "crypto";
import { getIyzicoConfig } from "@/lib/iyzico/config";

export interface IyzipayResponse {
  status: string;
  paymentStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  token?: string;
  paymentPageUrl?: string;
  paymentId?: string;
  conversationId?: string;
  paidPrice?: string;
}

const INITIALIZE_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const RETRIEVE_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function formatPrice(price: number | string): string {
  const value = parseFloat(String(price));
  if (!Number.isFinite(value)) return String(price);
  const result = value.toString();
  return result.includes(".") ? result : `${result}.0`;
}

function generateRandomString(): string {
  return process.hrtime()[0] + Math.random().toString(8).slice(2);
}

function generateAuthorizationHeader(
  apiKey: string,
  secretKey: string,
  uri: string,
  body: Record<string, unknown>,
  randomString: string,
): string {
  const signature = createHmac("sha256", secretKey)
    .update(randomString + uri + JSON.stringify(body))
    .digest("hex");

  const authorizationParams = [
    `apiKey:${apiKey}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join("&");

  return `IYZWSv2 ${Buffer.from(authorizationParams).toString("base64")}`;
}

async function iyzicoPost(
  path: string,
  body: Record<string, unknown>,
): Promise<IyzipayResponse> {
  const config = getIyzicoConfig();
  if (!config) {
    throw new Error("iyzico yapılandırması eksik");
  }

  const randomString = generateRandomString();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-iyzi-rnd": randomString,
    "x-iyzi-client-version": "nexisai-iyzico-1.0.0",
    Authorization: generateAuthorizationHeader(
      config.apiKey,
      config.secretKey,
      path,
      body,
      randomString,
    ),
  };

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: IyzipayResponse;

  try {
    parsed = JSON.parse(text) as IyzipayResponse;
  } catch {
    throw new Error(
      `iyzico yanıtı okunamadı (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  return parsed;
}

export async function initializeCheckoutForm(
  request: Record<string, unknown>,
): Promise<IyzipayResponse> {
  const body = {
    ...request,
    price: formatPrice(request.price as string | number),
    paidPrice: formatPrice(request.paidPrice as string | number),
  };

  return iyzicoPost(INITIALIZE_PATH, body);
}

export async function retrieveCheckoutForm(
  token: string,
): Promise<IyzipayResponse> {
  return iyzicoPost(RETRIEVE_PATH, {
    locale: "tr",
    token,
  });
}

export const IyzicoConstants = {
  LOCALE_TR: "tr",
  CURRENCY_TRY: "TRY",
  PAYMENT_GROUP_PRODUCT: "PRODUCT",
  BASKET_ITEM_VIRTUAL: "VIRTUAL",
} as const;
