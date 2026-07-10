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
