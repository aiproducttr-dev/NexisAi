export const MANUFACTURER_CATEGORY = "Üretici Firma";

export function isManufacturerCategory(category: string): boolean {
  return category === MANUFACTURER_CATEGORY;
}

/** Üretici Firma listenin en altında kalır; diğerleri alfabetik. */
export function sortCategories<T extends { name: string }>(categories: T[]): T[] {
  const manufacturer = categories.filter((c) => c.name === MANUFACTURER_CATEGORY);
  const rest = categories
    .filter((c) => c.name !== MANUFACTURER_CATEGORY)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return [...rest, ...manufacturer];
}

export function sortCategoryNames(names: string[]): string[] {
  return sortCategories(names.map((name) => ({ name }))).map((c) => c.name);
}
