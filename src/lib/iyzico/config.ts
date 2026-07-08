export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export function getIyzicoConfig(): IyzicoConfig | null {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    return null;
  }

  const baseUrl =
    process.env.IYZICO_BASE_URL?.replace(/\/$/, "") ||
    (process.env.IYZICO_SANDBOX === "true"
      ? "https://sandbox-api.iyzipay.com"
      : "https://api.iyzipay.com");

  return { apiKey, secretKey, baseUrl };
}

export function isIyzicoEnabled(): boolean {
  return getIyzicoConfig() !== null || process.env.IYZICO_BYPASS_PAYMENT === "true";
}
