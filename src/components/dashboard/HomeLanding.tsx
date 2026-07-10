"use client";

import Link from "next/link";
import { Orbitron } from "next/font/google";
import { ArrowRight } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import SupportContact from "@/components/layout/SupportContact";

import FuturisticScene3D from "@/components/landing/FuturisticScene3D";
import LandingAppFeatures from "@/components/landing/LandingAppFeatures";
import SupportedAIPlatforms from "@/components/landing/SupportedAIPlatforms";
import LandingCorporateSections from "@/components/landing/LandingCorporateSections";
import "@/components/landing/landing-futuristic.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-orbitron",
});

const REGISTER_HREF = "/auth?mode=register&redirect=/dashboard";
const LOGIN_HREF = "/auth?redirect=/dashboard";

const STEPS = [
  {
    step: "01",
    icon: "🏪",
    title: "İşletmenizi Tanımlayın",
    description:
      "İşletme adınızı, sektörünüzü ve şehrinizi girin. Kurulum birkaç dakika sürer, teknik bilgi gerekmez.",
  },
  {
    step: "02",
    icon: "📋",
    title: "Kampanyanızı Planlayın",
    description:
      "Günlük bütçenizi ve kampanya sürenizi belirleyin. Tüm maliyetler baştan net — sürpriz yok.",
  },
  {
    step: "03",
    icon: "🚀",
    title: "Yayına Alın",
    description:
      "Kampanyanızı başlatın; içerikleriniz hazırlanır ve yayına girer. Siz işinize odaklanın.",
  },
] as const;

export default function HomeLanding() {
  return (
    <div className={`landing-futuristic min-h-screen overflow-x-hidden bg-[#050505] ${orbitron.variable}`}>
      <FuturisticScene3D />
      <div className="lf-grid-overlay" aria-hidden />
      <div className="lf-vignette" aria-hidden />

      <div className="lf-page mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="lf-animate-in flex flex-col items-center gap-5 py-6 sm:py-8">
          <BrandLogo href="/" size="2xl" priority centered />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={LOGIN_HREF}
              className="touch-target inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-[#94a3b8] transition hover:border-cyan-500/40 hover:text-[#e2e8f0]"
            >
              Giriş Yap
            </Link>
            <Link
              href={REGISTER_HREF}
              className="touch-target inline-flex min-h-[44px] items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-[#e2e8f0] shadow-[0_0_20px_rgba(139,92,246,0.15)] transition hover:border-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] sm:shrink-0"
            >
              Hemen Başlayın →
            </Link>
          </div>
          <SupportContact className="mt-2 w-full max-w-md" />
        </nav>

        <section className="grid min-h-0 items-center gap-10 pb-12 pt-2 sm:gap-12 sm:pb-16 sm:pt-4 lg:min-h-[calc(100vh-100px)] lg:grid-cols-2">
          <div className="min-w-0 max-w-xl">
            <div className="lf-animate-in lf-animate-in-1 mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.12)]">
              <span className="lf-badge-dot h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              Kurumsal Dijital Görünürlük
            </div>

            <h1 className="lf-animate-in lf-animate-in-2 lf-orbitron text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
              <span className="lf-title-gradient">İşletmenizi</span>{" "}
              Yapay Zeka Çağında Öne Çıkarın
            </h1>

            <p className="lf-animate-in lf-animate-in-3 mt-5 text-base leading-relaxed text-[#94a3b8] sm:text-lg">
              NexisAI, işletmenizin dijital dünyada keşfedilmesini ve
              önerilmesini sağlayan kurumsal bir görünürlük platformudur.
              Kampanyanızı başlatın, gerisini biz yönetelim.
            </p>

            <div className="lf-animate-in lf-animate-in-4 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href={REGISTER_HREF}
                className="lf-btn-primary relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(139,92,246,0.55),0_0_80px_rgba(6,182,212,0.2)] sm:py-4"
              >
                <span className="relative z-10">Kampanyanızı Başlatın</span>
                <ArrowRight className="relative z-10 h-4 w-4" />
              </Link>
              <a
                href="#nasil-calisir"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-700/40 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-[#94a3b8] transition hover:border-cyan-500/40 hover:text-[#e2e8f0] hover:shadow-[0_0_24px_rgba(6,182,212,0.1)] sm:py-4"
              >
                Nasıl Çalışır?
              </a>
            </div>

            <div className="lf-animate-in lf-animate-in-5 mt-8 grid grid-cols-3 gap-4 sm:mt-10 sm:flex sm:flex-wrap sm:gap-8">
              <div>
                <p className="lf-orbitron lf-stat-value text-xl font-bold text-cyan-400 sm:text-2xl">
                  24
                </p>
                <p className="mt-1 text-xs tracking-wide text-[#94a3b8]">Sektör</p>
              </div>
              <div>
                <p className="lf-orbitron lf-stat-value text-xl font-bold text-cyan-400 sm:text-2xl">
                  81
                </p>
                <p className="mt-1 text-xs tracking-wide text-[#94a3b8]">İl</p>
              </div>
              <div>
                <p className="lf-orbitron lf-stat-value text-xl font-bold text-cyan-400 sm:text-2xl">
                  7/24
                </p>
                <p className="mt-1 text-xs tracking-wide text-[#94a3b8]">
                  Otomatik Yayın
                </p>
              </div>
            </div>
          </div>

          <div className="hidden min-h-[320px] lg:block" aria-hidden />
        </section>

        <section className="pb-12 pt-4" id="nasil-calisir">
          <div className="lf-animate-in mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.55)]">
              Süreç
            </p>
            <h2 className="lf-orbitron mt-3 text-2xl font-bold text-white sm:text-3xl">
              3 Adımda Başlayın
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#94a3b8]">
              Kayıt olun, kampanyanızı planlayın ve yayına alın.
              Dakikalar içinde işletmeniz dijital görünürlük kazanır.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((card, index) => {
              const delayClass =
                index === 0 ? "lf-card-1" : index === 1 ? "lf-card-2" : "lf-card-3";
              return (
                <article
                  key={card.step}
                  className={`lf-animate-in lf-card-border ${delayClass} rounded-[20px] p-[2px] opacity-0 transition hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(139,92,246,0.25),0_0_40px_rgba(6,182,212,0.15)]`}
                >
                  <div className="relative h-full overflow-hidden rounded-[18px] bg-[rgba(8,8,12,0.92)] p-8 backdrop-blur-md">
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12),transparent_70%)]"
                      aria-hidden
                    />
                    <p className="lf-orbitron lf-step-num text-4xl font-extrabold opacity-35">
                      {card.step}
                    </p>
                    <div className="mb-5 mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-2xl shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#94a3b8]">
                      {card.description}
                    </p>
                    <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <SupportedAIPlatforms />

        <LandingCorporateSections />

        <LandingAppFeatures />

        <div className="lf-animate-in lf-animate-in-2 relative mb-16 overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 px-6 py-12 text-center sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]"
            aria-hidden
          />
          <h2 className="lf-orbitron relative text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            İşletmenizi Dijitalde Güçlendirin
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-[#94a3b8]">
            NexisAI ile kampanyanızı bugün başlatın. Profesyonel içerik,
            otomatik yayın ve şeffaf yönetim — hepsi tek platformda.
          </p>
          <p className="relative mx-auto mt-2 max-w-sm text-xs text-[#64748b]">
            Güvenli ödeme ile kampanyanızı hemen başlatın.
          </p>
          <Link
            href={REGISTER_HREF}
            className="lf-btn-primary relative mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 sm:py-4"
          >
            <span className="relative z-10">Ücretsiz Kayıt Olun</span>
            <ArrowRight className="relative z-10 h-4 w-4" />
          </Link>
        </div>

        <footer className="border-t border-white/5 py-8 text-center text-xs text-[#94a3b8]">
          © {new Date().getFullYear()} NexisAI · Kurumsal Dijital Görünürlük Platformu
        </footer>
      </div>
    </div>
  );
}
