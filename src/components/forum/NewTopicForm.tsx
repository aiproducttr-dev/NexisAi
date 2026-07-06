"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TURKISH_CITIES } from "@/lib/constants/cities";
import { Loader2, PlusCircle } from "lucide-react";

export default function NewTopicForm({
  categories,
  defaultOpen = false,
}: {
  categories: string[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [city, setCity] = useState("İstanbul");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, city }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Konu oluşturulamadı");
      }

      router.push(`/forum/t/${data.topic.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lf-btn-primary lf-animate-in lf-animate-in-2 mt-6 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
      >
        <PlusCircle className="h-4 w-4" />
        Soru sor
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="lf-card-surface lf-animate-in lf-animate-in-2 mt-6 space-y-4 p-5"
    >
      <h2 className="lf-orbitron text-lg font-bold text-white">Yeni soru</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[#94a3b8]">Kategori</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white"
            required
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-[#94a3b8]">Şehir</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white"
            required
          >
            {TURKISH_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-[#94a3b8]">Başlık</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white"
          placeholder="Kısa ve net bir başlık"
          required
          minLength={5}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-[#94a3b8]">Sorunuz</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white"
          placeholder="Detayları buraya yazın..."
          required
          minLength={10}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="lf-btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
          Yayınla
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#94a3b8]"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
