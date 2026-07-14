export const FREE_TRIAL_DAILY_BUDGET = 200;
export const FREE_TRIAL_DAYS = 1;

export const FREE_TRIAL_ALREADY_USED_MESSAGE =
  "⚠️ Bu işletme adı veya e-posta adresi için daha önce ücretsiz deneme başlatılmış. Lütfen mevcut hesabınızla giriş yapın veya destek ekibiyle iletişime geçin.";

export function normalizeTrialEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeTrialBusinessName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

export function generateTrialPassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
