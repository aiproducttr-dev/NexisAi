import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ExternalLink, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/constants/metrics";
import { forumTopicUrl } from "@/lib/constants/urls";
import DashboardActions from "@/components/dashboard/DashboardActions";
import AppNav from "@/components/layout/AppNav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    console.error("Dashboard campaigns fetch error:", campaignsError);
  }

  const campaignIds = campaigns?.map((c) => c.id) ?? [];
  const { data: publishedContents } =
    campaignIds.length > 0
      ? await supabase
          .from("published_contents")
          .select("campaign_id, wordpress_url, devto_url")
          .in("campaign_id", campaignIds)
      : { data: [] };

  const wordpressUrlByCampaign = new Map(
    (publishedContents ?? [])
      .filter((item) => item.wordpress_url)
      .map((item) => [item.campaign_id, item.wordpress_url as string]),
  );

  const devtoUrlByCampaign = new Map(
    (publishedContents ?? [])
      .filter((item) => item.devto_url)
      .map((item) => [item.campaign_id, item.devto_url as string]),
  );

  const { data: forumTopics } =
    campaignIds.length > 0
      ? await supabase
          .from("forum_topics")
          .select("slug, campaign_id, title")
          .in("campaign_id", campaignIds)
          .eq("topic_type", "question")
          .order("created_at", { ascending: true })
      : { data: [] };

  const forumTopicsByCampaign = new Map<string, { slug: string; title: string }[]>();
  for (const topic of forumTopics ?? []) {
    const list = forumTopicsByCampaign.get(topic.campaign_id) ?? [];
    list.push({ slug: topic.slug, title: topic.title });
    forumTopicsByCampaign.set(topic.campaign_id, list);
  }

  let createdForumTopics: { slug: string; title: string }[] = [];
  let createdWordpressUrl: string | null = null;
  let createdDevtoUrl: string | null = null;
  if (params.created) {
    const campaign = campaigns?.find((c) => c.content_slug === params.created);
    if (campaign) {
      createdForumTopics = forumTopicsByCampaign.get(campaign.id) ?? [];
    }

    const { data: publishedContent } = await supabase
      .from("published_contents")
      .select("wordpress_url, devto_url")
      .eq("slug", params.created)
      .maybeSingle();

    createdWordpressUrl = publishedContent?.wordpress_url ?? null;
    createdDevtoUrl = publishedContent?.devto_url ?? null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AppNav
        logoHref="/dashboard"
        userLabel={profile?.full_name || user.email || undefined}
        right={<DashboardActions />}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {params.created && (
          <div className="lf-animate-in lf-animate-in-1 mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300">
              Kampanyanız başarıyla oluşturuldu!{" "}
              <Link
                href={`/content/${params.created}`}
                className="font-semibold text-emerald-200 underline"
              >
                İçerik NexisAI&apos;da yayında
              </Link>
              {createdWordpressUrl && (
                <>
                  {" · "}
                  <a
                    href={createdWordpressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-200 underline"
                  >
                    Blog yazısı nexisai.blog&apos;da
                  </a>
                </>
              )}
              {createdDevtoUrl && (
                <>
                  {" · "}
                  <a
                    href={createdDevtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-200 underline"
                  >
                    dev.to&apos;da yayında
                  </a>
                </>
              )}
              {createdForumTopics.length > 0 && (
                <>
                  {" · "}
                  <a
                    href={forumTopicUrl(createdForumTopics[0].slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-200 underline"
                  >
                    {createdForumTopics.length > 1
                      ? `${createdForumTopics.length} forum sorusu nexisaiform.com'da`
                      : "Forum sorusu nexisaiform.com'da"}
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        <div className="lf-animate-in lf-animate-in-2 mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              Yönetim Paneli
            </p>
            <h1 className="lf-orbitron mt-2 text-3xl font-bold text-white sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Kampanyalarınızı görüntüleyin ve yönetin.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="lf-btn-primary relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
          >
            <Plus className="relative z-10 h-5 w-5" />
            <span className="relative z-10">Yeni Kampanya</span>
          </Link>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const campaignForumTopics =
                forumTopicsByCampaign.get(campaign.id) ?? [];
              const primaryForum = campaignForumTopics[0];
              const wordpressUrl = wordpressUrlByCampaign.get(campaign.id);
              const devtoUrl = devtoUrlByCampaign.get(campaign.id);

              return (
              <div key={campaign.id} className="lf-card-surface p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {campaign.business_name}
                    </h3>
                    <p className="text-sm text-[#94a3b8]">
                      {campaign.category} · {campaign.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        campaign.status === "active"
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border border-white/10 bg-white/5 text-[#94a3b8]"
                      }`}
                    >
                      {campaign.status === "active" ? "Aktif" : campaign.status}
                    </span>
                    {campaign.content_slug && (
                      <>
                        <Link
                          href={`/content/${campaign.content_slug}`}
                          className="flex items-center gap-1 text-sm font-medium text-cyan-400 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          NexisAI İçerik
                        </Link>
                        {wordpressUrl && (
                          <a
                            href={wordpressUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Blog
                          </a>
                        )}
                        {devtoUrl && (
                          <a
                            href={devtoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            dev.to
                          </a>
                        )}
                        {primaryForum && (
                          <a
                            href={forumTopicUrl(primaryForum.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-violet-400 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Forum
                            {campaignForumTopics.length > 1
                              ? ` (${campaignForumTopics.length})`
                              : ""}
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-xs text-[#64748b]">Toplam Tutar</p>
                    <p className="lf-orbitron mt-1 font-semibold text-white">
                      {formatCurrency(Number(campaign.total_cost))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="flex items-center gap-1 text-xs text-[#64748b]">
                      <TrendingUp className="h-3 w-3" />
                      Görünürlük
                    </p>
                    <p className="lf-orbitron mt-1 font-semibold text-emerald-400">
                      +%{campaign.visibility_increase}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-xs text-[#64748b]">Günlük Bütçe</p>
                    <p className="lf-orbitron mt-1 font-semibold text-white">
                      {formatCurrency(Number(campaign.daily_budget))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="flex items-center gap-1 text-xs text-[#64748b]">
                      <Calendar className="h-3 w-3" />
                      Süre
                    </p>
                    <p className="lf-orbitron mt-1 font-semibold text-white">
                      {campaign.days} gün
                    </p>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="lf-card-border rounded-[20px] p-[2px]">
            <div className="lf-panel p-12 text-center">
              <p className="text-4xl">📋</p>
              <h3 className="lf-orbitron mt-4 text-xl font-bold text-white">
                Henüz kampanya yok
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#94a3b8]">
                İlk kampanyanızı oluşturarak işletmenizin dijital görünürlüğünü
                artırmaya başlayın.
              </p>
              <Link
                href="/dashboard/new"
                className="lf-btn-primary relative mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-3 font-bold text-white transition hover:-translate-y-0.5"
              >
                <Plus className="relative z-10 h-5 w-5" />
                <span className="relative z-10">İlk Kampanyanızı Başlatın</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
