"use client";

import { useState, useEffect } from "react";
import { TURKISH_CITIES } from "@/lib/constants/cities";
import {
  isManufacturerCategory,
  MANUFACTURER_CATEGORY,
  sortCategories,
} from "@/lib/constants/categories";
import { formatDailyVisibilityIncrease } from "@/lib/auth/admin";
import {
  BUDGET_MIN,
  DAYS_MIN,
  calculateVisibilityMetrics,
  formatCurrency,
} from "@/lib/constants/metrics";
import MetricsPreview, {
  BudgetSlider,
  DaysSlider,
} from "@/components/campaign/MetricsPreview";
import { createClient } from "@/lib/supabase/client";
import {
  clearCampaignDraft,
  loadCampaignDraft,
  saveCampaignDraft,
} from "@/lib/campaign/draft";
import {
  trackMetaInitiateCheckout,
} from "@/lib/analytics/meta-pixel";
import type { Category } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  MapPin,
  Tag,
  Package,
} from "lucide-react";

type Step = 1 | 2 | 3;

export default function CampaignWizard() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [draftRestored, setDraftRestored] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [city, setCity] = useState("");
  const [dailyBudget, setDailyBudget] = useState(BUDGET_MIN);
  const [days, setDays] = useState(DAYS_MIN);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (data) setCategories(sortCategories(data));
    }
    loadCategories();
  }, [supabase]);

  useEffect(() => {
    if (draftRestored) return;
    const draft = loadCampaignDraft();
    if (!draft) {
      setDraftRestored(true);
      return;
    }

    setBusinessName(draft.businessName);
    setCategory(draft.category);
    setProductDescription(draft.productDescription || "");
    setCity(draft.city);
    setDailyBudget(draft.dailyBudget || BUDGET_MIN);
    setDays(draft.days || DAYS_MIN);
    setStep(draft.step || 3);

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setInfo(
          "Hesabınız hazır. Kampanya bilgileriniz yüklendi — ödemeye devam edebilirsiniz.",
        );
      } else {
        setInfo(
          "Bilgileriniz kaydedildi. Ödeme için kayıt olun veya giriş yapın, ardından devam edin.",
        );
      }
    });

    setDraftRestored(true);
  }, [draftRestored, supabase.auth]);

  const metrics = calculateVisibilityMetrics(dailyBudget, days);

  const isManufacturer = isManufacturerCategory(category);
  const canProceedStep1 =
    businessName.trim().length >= 2 &&
    category &&
    city &&
    (!isManufacturer || productDescription.trim().length >= 3);
  const canProceedStep2 = dailyBudget >= BUDGET_MIN && days >= DAYS_MIN;

  function persistDraft(nextStep: Step = step) {
    saveCampaignDraft({
      businessName: businessName.trim(),
      category,
      productDescription: isManufacturer ? productDescription.trim() : "",
      city,
      dailyBudget,
      days,
      step: nextStep,
      updatedAt: Date.now(),
    });
  }

  async function handleStartCampaign() {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        persistDraft(3);
        window.location.assign(
          "/auth?mode=register&redirect=/dashboard/new",
        );
        return;
      }

      const res = await fetch("/api/payments/iyzico/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          city,
          dailyBudget,
          days,
          productDescription: isManufacturer
            ? productDescription.trim()
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ödeme başlatılamadı");
      }

      clearCampaignDraft();

      if (data.bypass && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (!data.paymentPageUrl) {
        throw new Error("Ödeme sayfası oluşturulamadı");
      }

      trackMetaInitiateCheckout({
        value: metrics.totalCost,
        contentName: businessName.trim(),
        checkoutId: data.checkoutId,
      });

      if (data.checkoutId) {
        localStorage.setItem("nexisai_checkout_id", data.checkoutId);
      }

      window.location.href = data.paymentPageUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kampanya başlatılamadı",
      );
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`lf-orbitron flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                step >= s
                  ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                  : "border border-white/10 bg-white/[0.03] text-[#64748b]"
              }`}
            >
              {s}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                step >= s ? "text-[#e2e8f0]" : "text-[#64748b]"
              }`}
            >
              {s === 1 ? "İşletme" : s === 2 ? "Bütçe" : "Onay"}
            </span>
            {s < 3 && (
              <div
                className={`mx-2 hidden h-px w-10 sm:block ${
                  step > s ? "bg-cyan-500/60" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          {info}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="lf-orbitron text-xl font-bold text-white sm:text-2xl">
            İşletme Bilgileri
          </h2>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-[#94a3b8]">
              <Building2 className="h-4 w-4 text-cyan-400" />
              İşletme Adı
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Örn: Lezzet Durağı"
              className="lf-input"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-[#94a3b8]">
              <Tag className="h-4 w-4 text-violet-400" />
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => {
                const next = e.target.value;
                setCategory(next);
                if (next !== MANUFACTURER_CATEGORY) {
                  setProductDescription("");
                }
              }}
              className="lf-select"
            >
              <option value="">Kategori seçin</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {isManufacturer && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-[#94a3b8]">
                <Package className="h-4 w-4 text-amber-400" />
                Ne üretiyorsunuz?
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Örn: plastik enjeksiyon parçaları, tekstil kumaşı, mobilya aksesuarı..."
                rows={3}
                maxLength={300}
                className="lf-input resize-y"
              />
              <p className="mt-1.5 text-xs text-[#64748b]">
                İçerikler ve forum soruları bu bilgiye göre özelleştirilir.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-[#94a3b8]">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Şehir
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="lf-select"
            >
              <option value="">Şehir seçin</option>
              {TURKISH_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="lf-btn-primary relative flex w-full min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="relative z-10">Devam Et</span>
            <ArrowRight className="relative z-10 h-4 w-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="lf-orbitron text-xl font-bold text-white sm:text-2xl">
              Bütçe & Süre
            </h2>
            <BudgetSlider value={dailyBudget} onChange={setDailyBudget} />
            <DaysSlider value={days} onChange={setDays} />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-[#e2e8f0]"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="lf-btn-primary relative flex flex-1 min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="relative z-10">Devam Et</span>
                <ArrowRight className="relative z-10 h-4 w-4" />
              </button>
            </div>
          </div>

          <MetricsPreview dailyBudget={dailyBudget} days={days} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="lf-orbitron text-xl font-bold text-white sm:text-2xl">
            Kampanya Özeti
          </h2>

          <div className="lf-card-surface space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[#64748b]">İşletme</p>
                <p className="font-semibold text-white">{businessName}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Kategori</p>
                <p className="font-semibold text-white">{category}</p>
                {isManufacturer && productDescription.trim() && (
                  <p className="mt-1 text-xs text-amber-200/90">
                    Üretim: {productDescription.trim()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Şehir</p>
                <p className="font-semibold text-white">{city}</p>
              </div>
            </div>
            <hr className="border-white/5" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[#64748b]">Günlük Bütçe</p>
                <p className="lf-orbitron font-semibold text-white">
                  {formatCurrency(dailyBudget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Süre</p>
                <p className="lf-orbitron font-semibold text-white">{days} gün</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Toplam Tutar</p>
                <p className="lf-orbitron font-semibold text-cyan-400">
                  {formatCurrency(metrics.totalCost)}
                </p>
              </div>
            </div>
            <hr className="border-white/5" />
            <div className="text-center">
              <p className="text-sm text-[#94a3b8]">Günlük Tahmini Artış</p>
              <p className="lf-orbitron text-4xl font-bold text-emerald-400">
                {formatDailyVisibilityIncrease(metrics.visibilityIncrease, days)}%
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Kampanya toplamı +%{metrics.visibilityIncrease}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100/90">
            Ödeme iyzico güvenli ödeme altyapısı ile alınır. Henüz üye
            değilseniz bu adımda e-posta ile hızlı kayıt isteyeceğiz; ardından
            ödemeye geçilir. Onay sonrası kampanyanız otomatik başlatılır.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-[#e2e8f0]"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleStartCampaign}
              disabled={loading}
              className="lf-btn-primary relative flex min-h-[52px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl py-4 text-lg font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="relative z-10 h-5 w-5 animate-spin" />
                  <span className="relative z-10">Oluşturuluyor...</span>
                </>
              ) : (
                <span className="relative z-10">
                  Ödeme Yap ve Başlat ({formatCurrency(metrics.totalCost)})
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
