import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ForumNav from "@/components/forum/ForumNav";
import ReplyForm from "@/components/forum/ReplyForm";
import { getAppBaseUrl } from "@/lib/constants/urls";
import type { ForumReply, ForumTopic } from "@/lib/types";
import { ArrowLeft, ExternalLink, MapPin, MessageSquare, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const appUrl = getAppBaseUrl();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!topic) notFound();

  const typedTopic = topic as ForumTopic;

  const { data: replies } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("topic_id", typedTopic.id)
    .order("created_at", { ascending: true });

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  const userLabel = profile?.full_name || user?.email;
  const mainBody = typedTopic.body.split("---")[0].trim();

  return (
    <>
      <ForumNav userLabel={userLabel} isLoggedIn={!!user} />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          href="/forum"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#94a3b8] transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm konular
        </Link>

        <article className="lf-card-surface mb-6 p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
              <Tag className="h-3 w-3" />
              {typedTopic.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              <MapPin className="h-3 w-3" />
              {typedTopic.city}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {typedTopic.business_name}
            </span>
          </div>

          <h1 className="lf-orbitron mb-4 text-2xl font-bold text-white sm:text-3xl">
            {typedTopic.title}
          </h1>

          <p className="mb-2 text-xs text-[#64748b]">
            {formatDate(typedTopic.created_at)} · Kampanya konusu
          </p>

          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-[#cbd5e1]">
            {mainBody}
          </div>

          {typedTopic.content_slug && (
            <Link
              href={`${appUrl}/content/${typedTopic.content_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:underline"
            >
              Tam içeriği görüntüle
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </article>

        <section className="mb-6">
          <h2 className="lf-orbitron mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <MessageSquare className="h-5 w-5 text-violet-400" />
            Cevaplar ({typedTopic.reply_count})
          </h2>

          {replies && replies.length > 0 ? (
            <div className="space-y-3">
              {(replies as ForumReply[]).map((reply) => (
                <div key={reply.id} className="lf-card-surface p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      {reply.author_name}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[#cbd5e1]">
                    {reply.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="lf-card-surface p-6 text-center text-sm text-[#94a3b8]">
              Henüz cevap yok. İlk cevabı siz yazın.
            </div>
          )}
        </section>

        {user ? (
          <ReplyForm topicId={typedTopic.id} />
        ) : (
          <div className="lf-card-surface p-6 text-center">
            <p className="text-sm text-[#94a3b8]">
              Cevap yazmak için{" "}
              <Link
                href={`/auth?redirect=/forum/t/${slug}`}
                className="font-semibold text-cyan-400 hover:underline"
              >
                giriş yapın
              </Link>
              .
            </p>
          </div>
        )}
      </main>
    </>
  );
}
