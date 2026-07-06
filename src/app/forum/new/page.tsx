import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ForumNav from "@/components/forum/ForumNav";
import NewTopicForm from "@/components/forum/NewTopicForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewForumTopicPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  const categories = categoryRows?.map((c) => c.name) ?? [];
  const userLabel = profile?.full_name || user?.email;

  return (
    <>
      <ForumNav userLabel={userLabel} isLoggedIn={!!user} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/forum"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#94a3b8] transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm sorular
        </Link>

        <div className="lf-animate-in lf-animate-in-1 mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Yeni konu
          </p>
          <h1 className="lf-orbitron mt-2 text-3xl font-bold text-white">
            Soru sor
          </h1>
          <p className="mt-3 text-[#94a3b8]">
            Kategori ve şehrinizi seçin, başlığınızı ve sorunuzu yazın.
          </p>
        </div>

        {user ? (
          categories.length > 0 ? (
            <NewTopicForm categories={categories} defaultOpen />
          ) : (
            <p className="text-sm text-[#94a3b8]">
              Henüz kategori tanımlı değil. Lütfen daha sonra tekrar deneyin.
            </p>
          )
        ) : (
          <div className="lf-card-surface p-6 text-center">
            <p className="text-sm text-[#94a3b8]">
              Soru sormak için üye olmanız gerekiyor.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth?mode=register&redirect=/forum/new"
                className="lf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold text-white"
              >
                Kayıt ol
              </Link>
              <Link
                href="/auth?redirect=/forum/new"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#94a3b8] hover:text-white"
              >
                Giriş yap
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
