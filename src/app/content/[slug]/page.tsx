import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { markdownToHtml } from "@/lib/content/markdown-to-html";
import { ArrowLeft } from "lucide-react";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("published_contents")
    .select("*, campaigns(business_name, category, city)")
    .eq("slug", slug)
    .single();

  if (!content) notFound();

  const campaign = content.campaigns as {
    business_name: string;
    category: string;
    city: string;
  } | null;

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-white/5">
        <div className="mx-auto grid max-w-4xl grid-cols-3 items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 justify-self-start text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Geri</span>
          </Link>
          <BrandLogo href="/" size="lg" centered />
          <div aria-hidden />
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        {campaign && (
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              {campaign.category}
            </span>
            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
              {campaign.city}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {campaign.business_name}
            </span>
          </div>
        )}

        <h1 className="mb-8 text-3xl font-bold leading-tight md:text-4xl">
          {content.title}
        </h1>

        <div
          className="prose prose-invert prose-indigo max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white prose-a:text-indigo-400"
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(content.content),
          }}
        />

        <footer className="mt-12 border-t border-white/5 pt-8 text-center text-sm text-zinc-500">
          <p>
            Bu içerik{" "}
            <Link href="/" className="text-indigo-400 hover:underline">
              NexisAI
            </Link>{" "}
            platformu tarafından yapay zeka görünürlük kampanyası kapsamında
            yayınlanmıştır.
          </p>
        </footer>
      </article>
    </div>
  );
}
