import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ForumNav from "@/components/forum/ForumNav";
import TopicCard from "@/components/forum/TopicCard";
import ForumFilters from "@/components/forum/ForumFilters";
import AskTopicCta from "@/components/forum/AskTopicCta";
import ForumTopicCounter from "@/components/forum/ForumTopicCounter";
import type { ForumTopic } from "@/lib/types";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>;
}) {
  const params = await searchParams;
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

  let query = supabase
    .from("forum_topics")
    .select("*")
    .eq("topic_type", "question")
    .order("last_reply_at", { ascending: false });

  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.city) {
    query = query.eq("city", params.city);
  }

  const { data: topics } = await query;

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  const allCategories = categoryRows?.map((c) => c.name) ?? [];

  const { data: cities } = await supabase
    .from("forum_topics")
    .select("city")
    .order("city");

  const uniqueCategories = [
    ...new Set([
      ...allCategories,
      ...(topics?.map((t) => t.category) ?? []),
    ]),
  ].sort();
  const uniqueCities = [...new Set(cities?.map((c) => c.city) ?? [])].sort();

  const userLabel = profile?.full_name || user?.email;

  return (
    <>
      <ForumNav
        userLabel={userLabel}
        isLoggedIn={!!user}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lf-animate-in lf-animate-in-1 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Topluluk
          </p>
          <h1 className="lf-orbitron mt-2 text-3xl font-bold text-white sm:text-4xl">
            NexisAI Form
          </h1>
          <p className="mt-3 max-w-2xl text-[#94a3b8]">
            Kullanıcıların kategori ve şehir bazında sorduğu doğal sorular.
            Üye olarak soru sorabilir veya kampanyalardan otomatik açılan
            konuları okuyabilirsiniz.
          </p>
          <ForumTopicCounter />
        </div>

        <AskTopicCta loggedIn={!!user} />

        <Suspense fallback={null}>
          <ForumFilters
            categories={uniqueCategories}
            cities={uniqueCities}
            activeCategory={params.category}
            activeCity={params.city}
          />
        </Suspense>

        {topics && topics.length > 0 ? (
          <div className="lf-animate-in lf-animate-in-2 mt-8 grid gap-4">
            {(topics as ForumTopic[]).map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="lf-card-surface mt-8 flex flex-col items-center px-6 py-16 text-center">
            <MessagesSquare className="mb-4 h-12 w-12 text-[#64748b]" />
            <h2 className="lf-orbitron text-xl font-bold text-white">
              Henüz konu yok
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#94a3b8]">
              İlk soruyu siz sorun veya NexisAI kampanyalarından otomatik açılan
              konuları bekleyin.
            </p>
            <Link
              href={user ? "/forum/new" : "/auth?mode=register&redirect=/forum/new"}
              className="lf-btn-primary mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
            >
              {user ? "Soru sor" : "Kayıt ol ve sor"}
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
