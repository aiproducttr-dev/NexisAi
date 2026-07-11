/** Same-origin path only — safe for middleware and mobile WebViews. */
export function getSafeInternalPath(
  redirect: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!redirect) return fallback;

  const path = redirect.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("://")) return fallback;
  if (/[\s<>"']/.test(path)) return fallback;

  return path;
}

export function resolvePostAuthPath(
  redirect: string | null | undefined,
  options?: { preferDashboardList?: boolean },
): string {
  const safe = getSafeInternalPath(redirect, "/dashboard");
  if (options?.preferDashboardList && safe === "/dashboard/new") {
    return "/dashboard";
  }
  return safe;
}
