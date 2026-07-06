"use client";

const CORPORATE_VALUES = [
  {
    icon: "🏢",
    title: "Kurumsal Altyapı",
    description:
      "Güvenilir, ölçeklenebilir ve profesyonel bir platform. İşletmenizin dijital görünürlüğünü kurumsal standartlarda yönetin.",
  },
  {
    icon: "🗺️",
    title: "Türkiye Geneli Kapsam",
    description:
      "81 il ve 24 sektörde hizmet. İster yerel ister ulusal ölçekte işletmenizi hedef kitlenize ulaştırın.",
  },
  {
    icon: "✍️",
    title: "Profesyonel İçerik",
    description:
      "İşletmenize özel, sektörünüze uygun tanıtım içerikleri otomatik hazırlanır ve yayına alınır.",
  },
  {
    icon: "📊",
    title: "Şeffaf Yönetim",
    description:
      "Kampanyanızı panelden takip edin. Bütçe, süre ve yayın durumunu tek ekrandan kontrol edin.",
  },
] as const;

const SECTORS = [
  "Restoran & Kafe",
  "Güzellik & Kuaför",
  "Sağlık & Klinik",
  "Emlak",
  "E-ticaret",
  "Hukuk & Danışmanlık",
  "Otomotiv",
  "Eğitim & Kurs",
  "Turizm & Otel",
  "İnşaat & Mimarlık",
] as const;

export default function LandingCorporateSections() {
  return (
    <>
      <section className="pb-20 pt-4">
        <div className="lf-animate-in mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Kurumsal Çözüm
          </p>
          <h2 className="lf-orbitron mt-3 text-2xl font-bold text-white sm:text-3xl">
            Neden NexisAI?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#94a3b8]">
            Dijital çağda işletmenizin görünürlüğünü artırmak için
            ihtiyacınız olan her şey tek platformda.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CORPORATE_VALUES.map((item, index) => {
            const delayClass =
              index === 0
                ? "lf-card-1"
                : index === 1
                  ? "lf-card-2"
                  : index === 2
                    ? "lf-card-3"
                    : "lf-feat-1";
            return (
              <article
                key={item.title}
                className={`lf-animate-in lf-card-border ${delayClass} rounded-[20px] p-[2px] opacity-0 transition hover:-translate-y-1`}
              >
                <div className="h-full rounded-[18px] bg-[rgba(8,8,12,0.92)] p-6 backdrop-blur-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-2xl">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="lf-animate-in lf-animate-in-2 relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-8 sm:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]"
            aria-hidden
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Sektör Kapsamı
              </p>
              <h2 className="lf-orbitron mt-3 text-2xl font-bold text-white sm:text-3xl">
                Her Sektörden İşletmeye
                <br />
                <span className="lf-title-gradient">Profesyonel Destek</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#94a3b8]">
                Restorandan emlağa, sağlıktan e-ticarete — sektörünüz ne olursa
                olsun NexisAI işletmenizi doğru müşterilere ulaştırır.
                Kayıt olun, kampanyanızı dakikalar içinde başlatın.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((sector) => (
                <span
                  key={sector}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#cbd5e1]"
                >
                  {sector}
                </span>
              ))}
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                +14 sektör daha
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
