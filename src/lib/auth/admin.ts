export function getAdminEmails(): string[] {
  const raw = process.env.NEXISAI_ADMIN_EMAILS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}

export function formatDailyVisibilityIncrease(
  visibilityIncrease: number,
  days: number,
): string {
  const daily = days > 0 ? visibilityIncrease / days : visibilityIncrease;
  const rounded = Math.round(daily * 10) / 10;
  return `+${rounded.toLocaleString("tr-TR", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}`;
}
