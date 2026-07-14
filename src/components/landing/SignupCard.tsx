"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BUDGET_MIN, DAYS_MIN } from "@/lib/constants/metrics";
import { loadCampaignDraft, saveCampaignDraft } from "@/lib/campaign/draft";
import { trackMetaCompleteRegistration } from "@/lib/analytics/meta-pixel";

interface SignupCardProps {
  open: boolean;
  onClose: () => void;
  initialBusinessName?: string;
  /** After session is ready. If omitted, redirects to /dashboard/new */
  onSuccess?: (payload: { businessName: string; email: string }) => void;
  redirectTo?: string;
  variant?: "landing" | "checkout";
}

export default function SignupCard({
  open,
  onClose,
  initialBusinessName = "",
  onSuccess,
  redirectTo = "/dashboard/new",
  variant = "landing",
}: SignupCardProps) {
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
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedName = businessName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/quick-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: trimmedName,
          email: trimmedEmail,
          redirect: redirectTo,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || "Kayıt oluşturulamadı",
        );
      }

      const signInEmail = (data as { email?: string }).email;
      const password = (data as { password?: string }).password;
      const nextPath =
        (data as { redirectTo?: string }).redirectTo || redirectTo;

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

      if (variant === "landing") {
        saveCampaignDraft({
          businessName: trimmedName,
          category: "",
          productDescription: "",
          city: "",
          dailyBudget: BUDGET_MIN,
          days: DAYS_MIN,
          step: 1,
          updatedAt: Date.now(),
        });
      } else {
        const existing = loadCampaignDraft();
        if (existing) {
          saveCampaignDraft({
            ...existing,
            businessName: trimmedName || existing.businessName,
            updatedAt: Date.now(),
          });
        }
      }

      if (onSuccess) {
        onSuccess({ businessName: trimmedName, email: trimmedEmail });
        setLoading(false);
        return;
      }

      const businessParam = encodeURIComponent(trimmedName);
      const separator = nextPath.includes("?") ? "&" : "?";
      window.location.assign(
        `${nextPath}${separator}business=${businessParam}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt oluşturulamadı");
      setLoading(false);
    }
  }

  const title =
    variant === "checkout"
      ? "Ödemeye Geçmek İçin Kayıt Olun"
      : "Hemen Kayıt Olun";

  const submitLabel =
    variant === "checkout" ? "Kayıt Ol ve Ödemeye Geç" : "Kayıt Ol ve Devam Et";

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
            Hızlı Kayıt
          </p>
          <h2
            id={titleId}
            className="lf-orbitron mt-2 text-2xl font-bold text-white"
          >
            {title}
          </h2>

          <ul className="mt-5 space-y-2.5 text-sm text-[#e2e8f0]">
            <li className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
              🎁 %100 Hızlı Başlangıç
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
              <span className="relative z-10">{submitLabel}</span>
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#94a3b8]">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/auth?mode=login&redirect=/dashboard/new"
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
