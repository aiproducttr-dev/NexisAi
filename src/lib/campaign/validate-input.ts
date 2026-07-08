import { BUDGET_MAX, BUDGET_MIN, DAYS_MAX, DAYS_MIN } from "@/lib/constants/metrics";
import { isManufacturerCategory } from "@/lib/constants/categories";

export interface CampaignInput {
  businessName: string;
  category: string;
  city: string;
  dailyBudget: number;
  days: number;
  productDescription?: string | null;
}

export function validateCampaignInput(body: unknown): CampaignInput {
  if (!body || typeof body !== "object") {
    throw new Error("Geçersiz istek");
  }

  const { businessName, category, city, dailyBudget, days, productDescription } =
    body as Record<string, unknown>;

  if (
    !businessName ||
    !category ||
    !city ||
    dailyBudget === undefined ||
    days === undefined
  ) {
    throw new Error("Tüm alanlar zorunludur");
  }

  const budget = Number(dailyBudget);
  const dayCount = Number(days);

  if (!Number.isFinite(budget) || budget < BUDGET_MIN || budget > BUDGET_MAX) {
    throw new Error("Günlük bütçe 200-5000 TL arasında olmalıdır");
  }

  if (!Number.isFinite(dayCount) || dayCount < DAYS_MIN || dayCount > DAYS_MAX) {
    throw new Error("Gün sayısı 1-30 arasında olmalıdır");
  }

  const name = String(businessName).trim();
  if (name.length < 2) {
    throw new Error("İşletme adı en az 2 karakter olmalıdır");
  }

  const categoryName = String(category);
  const product =
    productDescription === undefined || productDescription === null
      ? null
      : String(productDescription).trim();

  if (isManufacturerCategory(categoryName)) {
    if (!product || product.length < 3) {
      throw new Error("Üretici firma için ne ürettiğinizi en az 3 karakter ile yazın");
    }
    if (product.length > 300) {
      throw new Error("Ürün açıklaması en fazla 300 karakter olabilir");
    }
  }

  return {
    businessName: name,
    category: categoryName,
    city: String(city),
    dailyBudget: budget,
    days: dayCount,
    productDescription: isManufacturerCategory(categoryName) ? product : null,
  };
}

export function isPaymentBypassEnabled(): boolean {
  return process.env.IYZICO_BYPASS_PAYMENT === "true";
}
