"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function ReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cevap gönderilemedi");
      }

      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lf-card-surface p-5">
      <h3 className="lf-orbitron mb-3 text-sm font-bold text-white">
        Cevap Yaz
      </h3>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={3}
        rows={4}
        placeholder="Deneyiminizi veya önerinizi paylaşın..."
        className="lf-input resize-none"
      />

      <button
        type="submit"
        disabled={loading || body.trim().length < 3}
        className="lf-btn-primary relative mt-3 flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
        ) : (
          <Send className="relative z-10 h-4 w-4" />
        )}
        <span className="relative z-10">Gönder</span>
      </button>
    </form>
  );
}
