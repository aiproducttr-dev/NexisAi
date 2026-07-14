"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  FREE_TRIAL_DAILY_BUDGET,
  FREE_TRIAL_DAYS,
} from "@/lib/auth/free-trial";
import { trackMetaCompleteRegistration } from "@/lib/analytics/meta-pixel";

interface FreeTrialSignupCardProps {
  open: boolean;
  onClose: () => void;
  initialBusinessName?: string;
}

export default function FreeTrialSignupCard({
  open,
  onClose,
  initialBusinessName = "",
}: FreeTrialSignupCardProps) {
  const titleId = useId();
  const supabase = createClient();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setBusinessName(initialBusinessName);
      setError("");
    }
  }, [open, initialBusinessName]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            "Ücretsiz deneme başlatılamadı",
        );
      }

      const signInEmail = (data as { email?: string }).email;
      const password = (data as { password?: string }).password;
      const redirectTo =
        (data as { redirectTo?: string }).redirectTo ||
        "/dashboard/new?trial=1";

      if (!signInEmail || !password) {
        throw new Error("Oturum açılamadı. Lütfen giriş ekranından deneyin.");
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: signInEmail,
          password,
        });

      if (signInError || !signInData.session) {
        throw new Error(
          signInError?.message ||
            "Kayıt tamamlandı fakat oturum açılamadı. Giriş Yap ile devam edin.",
        );
      }

      trackMetaCompleteRegistration();
      window.location.assign(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ücretsiz deneme başlatılamadı",
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="lf-animate-in relative w-full max-w-md overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#12121a] to-[#0a0a10] p-[1px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="rounded-[19px] bg-[#0b0b12]/95 p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Ücretsiz Deneme
          </p>
          <h2
            id={titleId}
            className="lf-orbitron mt-2 text-2xl font-bold text-white"
          >
            Ücretsiz Denemenizi Başlatın
          </h2>

          <ul className="mt-5 space-y-2.5 text-sm text-[#e2e8f0]">
            <li className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
              🎁 %100 Ücretsiz Başlangıç
            </li>
            <li className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3.5 py-2.5">
              💳 Kredi kartı veya ödeme bilgisi gerekmez.
            </li>
            <li className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3.5 py-2.5">
              ⏱️ Kurulum sadece 10 saniye sürer.
            </li>
          </ul>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#94a3b8]">
                İşletme Adı
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                placeholder="Örn: Smile İzmir"
                className="lf-input"
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#94a3b8]">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@email.com"
                className="lf-input"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lf-btn-primary relative flex w-full min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading && (
                <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
              )}
              <span className="relative z-10">Ücretsiz Denemeyi Başlat</span>
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-amber-100/90">
              <span>Deneme limiti</span>
              <span className="font-semibold">
                {FREE_TRIAL_DAILY_BUDGET} TL · {FREE_TRIAL_DAYS} gün
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/35">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.45)]" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-amber-50/95">
              🎁 Ücretsiz deneme hakkınız: En fazla {FREE_TRIAL_DAILY_BUDGET} TL
              bütçe ve {FREE_TRIAL_DAYS} gün kullanım süresi ile sınırlıdır.
            </p>
          </div>

          <p className="mt-5 text-center text-sm text-[#94a3b8]">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/auth?mode=login&redirect=/dashboard"
              className="font-semibold text-cyan-400 hover:underline"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
