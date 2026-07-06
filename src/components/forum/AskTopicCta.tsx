import Link from "next/link";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";

export default function AskTopicCta({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) {
    return (
      <div className="lf-card-surface lf-animate-in lf-animate-in-2 mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="lf-orbitron text-lg font-bold text-white">
            Bir sorunuz mu var?
          </h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Kategori ve şehrinizi seçerek topluluğa soru sorun.
          </p>
        </div>
        <Link
          href="/forum/new"
          className="lf-btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Soru sor
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="lf-card-surface lf-animate-in lf-animate-in-2 mb-8 p-5 sm:p-6">
      <h2 className="lf-orbitron text-lg font-bold text-white">
        Siz de soru sorun
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[#94a3b8]">
        Ücretsiz kayıt olun, kategori ve şehir seçerek kendi sorunuzu
        paylaşın. Topluluk ve diğer üyeler size cevap verebilir.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/auth?mode=register&redirect=/forum/new"
          className="lf-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        >
          <UserPlus className="h-4 w-4" />
          Kayıt ol ve sor
        </Link>
        <Link
          href="/auth?redirect=/forum/new"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-[#94a3b8] transition hover:border-cyan-500/30 hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          Giriş yap
        </Link>
      </div>
    </div>
  );
}
