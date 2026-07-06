import slugify from "slugify";

export function buildOrganicTopicSlug(title: string): string {
  const base = slugify(title.slice(0, 60), {
    lower: true,
    strict: true,
    locale: "tr",
  });
  const suffix = Date.now().toString(36).slice(-5);
  return base ? `${base}-${suffix}` : `soru-${suffix}`;
}

export function forumDisplayName(
  fullName: string | null | undefined,
  email: string | null | undefined
): string {
  if (fullName?.trim()) return fullName.trim();
  if (email) return email.split("@")[0] ?? "Üye";
  return "Üye";
}
