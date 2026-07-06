"use client";

const LOGO_VERSION = "202607062010";

const AI_PLATFORMS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    logo: `/logos/chatgpt.png?v=${LOGO_VERSION}`,
    description:
      "Dünyanın en çok kullanılan yapay zeka asistanında işletmenizin önerilmesini sağlayın. Müşteriler soru sorduğunda sizin adınız geçsin.",
  },
  {
    id: "gemini",
    name: "Gemini",
    company: "Google",
    logo: "/logos/gemini.png",
    description:
      "Google'ın yapay zeka ekosisteminde yer alın. Arama ve asistan deneyimlerinde işletmeniz görünür olsun.",
  },
  {
    id: "claude",
    name: "Claude",
    company: "Anthropic",
    logo: "/logos/claude.png",
    description:
      "Kurumsal kullanıcıların tercih ettiği Claude platformunda markanızın güvenilir bir seçenek olarak sunulmasını sağlayın.",
  },
] as const;

export default function SupportedAIPlatforms() {
  return (
    <section className="pb-20 pt-8" id="desteklenen-yapay-zekalar">
      <div className="lf-animate-in mb-14 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.55)]">
          Platform Entegrasyonu
        </p>
        <h2 className="lf-orbitron mt-3 text-2xl font-bold text-white sm:text-3xl">
          Desteklenen Yapay Zekalar
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#94a3b8]">
          NexisAI kampanyalarınız, önde gelen yapay zeka platformlarında
          işletmenizin keşfedilmesi ve önerilmesi için optimize edilir.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {AI_PLATFORMS.map((platform, index) => {
          const delayClass =
            index === 0 ? "lf-card-1" : index === 1 ? "lf-card-2" : "lf-card-3";
          return (
            <article
              key={platform.id}
              className={`lf-animate-in lf-card-border ${delayClass} rounded-[20px] p-[2px] opacity-0 transition hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(139,92,246,0.25),0_0_40px_rgba(6,182,212,0.15)]`}
            >
              <div className="relative flex h-full flex-col overflow-hidden rounded-[18px] bg-[rgba(8,8,12,0.92)] p-8 backdrop-blur-md">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12),transparent_70%)]"
                  aria-hidden
                />

                <div className="mb-6 flex h-20 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={platform.logo}
                    alt={`${platform.name} logosu`}
                    width={64}
                    height={64}
                    className="h-14 w-14 object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{platform.name}</h3>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    {platform.company}
                  </span>
                </div>

                <p className="flex-1 text-sm leading-relaxed text-[#94a3b8]">
                  {platform.description}
                </p>

                <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
