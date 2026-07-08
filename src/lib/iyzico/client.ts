import { getIyzicoConfig } from "@/lib/iyzico/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require("iyzipay") as new (config: {
  apiKey: string;
  secretKey: string;
  uri: string;
}) => IyzipayClient;

interface IyzipayClient {
  LOCALE: { TR: string; EN: string };
  CURRENCY: { TRY: string };
  PAYMENT_GROUP: { PRODUCT: string };
  BASKET_ITEM_TYPE: { VIRTUAL: string };
  checkoutFormInitialize: {
    create: (
      request: Record<string, unknown>,
      callback: (err: Error | null, result: IyzipayResponse) => void,
    ) => void;
  };
  checkoutForm: {
    retrieve: (
      request: { locale: string; token: string },
      callback: (err: Error | null, result: IyzipayResponse) => void,
    ) => void;
  };
}

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

function promisify<T extends IyzipayResponse>(
  fn: (
    request: Record<string, unknown>,
    callback: (err: Error | null, result: T) => void,
  ) => void,
  request: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(request, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export function getIyzipayClient(): IyzipayClient {
  const config = getIyzicoConfig();
  if (!config) {
    throw new Error("iyzico yapılandırması eksik");
  }

  return new Iyzipay({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    uri: config.baseUrl,
  });
}

export async function initializeCheckoutForm(
  request: Record<string, unknown>,
): Promise<IyzipayResponse> {
  const client = getIyzipayClient();
  return promisify(client.checkoutFormInitialize.create.bind(client.checkoutFormInitialize), request);
}

export async function retrieveCheckoutForm(
  token: string,
): Promise<IyzipayResponse> {
  const client = getIyzipayClient();
  const request = {
    locale: client.LOCALE.TR,
    token,
  };

  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(
      request,
      (err: Error | null, result: IyzipayResponse) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}
