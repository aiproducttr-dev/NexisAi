"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

export default function ForumFilters({
  categories,
  cities,
  activeCategory,
  activeCity,
}: {
  categories: string[];
  cities: string[];
  activeCategory?: string;
  activeCity?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: "category" | "city", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/forum?${params.toString()}`);
  }

  if (categories.length === 0 && cities.length === 0) return null;

  return (
    <div className="lf-card-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
        <Filter className="h-4 w-4 text-violet-400" />
        Filtrele
      </div>

      <select
        value={activeCategory ?? ""}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="lf-select sm:max-w-[220px]"
      >
        <option value="">Tüm kategoriler</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        value={activeCity ?? ""}
        onChange={(e) => updateFilter("city", e.target.value)}
        className="lf-select sm:max-w-[220px]"
      >
        <option value="">Tüm şehirler</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
}
