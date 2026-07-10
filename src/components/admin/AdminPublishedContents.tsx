import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AdminPanelLogoutButton from "@/components/admin/AdminPanelLogoutButton";
import AppNav from "@/components/layout/AppNav";
import { formatCurrency } from "@/lib/constants/metrics";
import { forumTopicUrl } from "@/lib/constants/urls";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPublishedContents() {
  const admin = createAdminClient();

  const { data: campaigns } = await admin
    .from("campaigns")
    .select(
      "id, business_name, category, city, status, content_slug, created_at, user_id, daily_budget, days, total_cost, visibility_increase",
    )
    .order("created_at", { ascending: false });

  const campaignIds = campaigns?.map((campaign) => campaign.id) ?? [];
  const userIds = [
    ...new Set(campaigns?.map((campaign) => campaign.user_id) ?? []),
  ];

  const { data: profiles } =
    userIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : { data: [] };

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const { data: publishedContents } =
    campaignIds.length > 0
      ? await admin
          .from("published_contents")
          .select("campaign_id, slug, title, wordpress_url, devto_url")
          .in("campaign_id", campaignIds)
      : { data: [] };

  const primaryContentByCampaign = new Map<
    string,
    {
      slug: string;
      title: string;
      wordpress_url: string | null;
      devto_url: string | null;
    }
  >();

  for (const item of publishedContents ?? []) {
    if (!primaryContentByCampaign.has(item.campaign_id)) {
      primaryContentByCampaign.set(item.campaign_id, item);
    }
  }

  const { data: forumTopics } =
    campaignIds.length > 0
      ? await admin
          .from("forum_topics")
          .select("campaign_id, slug, title")
          .in("campaign_id", campaignIds)
          .eq("topic_type", "question")
          .order("created_at", { ascending: true })
      : { data: [] };

  const forumTopicsByCampaign = new Map<
    string,
    { slug: string; title: string }[]
  >();
  for (const topic of forumTopics ?? []) {
    const list = forumTopicsByCampaign.get(topic.campaign_id) ?? [];
    list.push({ slug: topic.slug, title: topic.title });
    forumTopicsByCampaign.set(topic.campaign_id, list);
  }

  return (
    <>
      <AppNav
        logoHref="/om-admin-panel"
        right={<AdminPanelLogoutButton />}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Yönetici
          </p>
          <h1 className="lf-orbitron mt-2 text-3xl font-bold text-white sm:text-4xl">
            Yayınlanan İçerikler
          </h1>
          <p className="mt-2 text-sm text-[#94a3b8]">
            Tüm kampanyaların NexisAI, blog, dev.to ve forum yayınları.
          </p>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const profile = profileById.get(campaign.user_id);
              const content = primaryContentByCampaign.get(campaign.id);
              const slug = content?.slug ?? campaign.content_slug;
              const forumList = forumTopicsByCampaign.get(campaign.id) ?? [];

              return (
                <div key={campaign.id} className="lf-card-surface p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {campaign.business_name}
                      </h2>
                      <p className="text-sm text-[#94a3b8]">
                        {campaign.category} · {campaign.city}
                      </p>
                      <p className="mt-2 text-xs text-[#64748b]">
                        {profile?.full_name || "—"} ·{" "}
                        {profile?.email || campaign.user_id}
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {formatCurrency(Number(campaign.total_cost))} ·{" "}
                        {campaign.days} gün · +%{campaign.visibility_increase}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {slug && (
                        <Link
                          href={`/content/${slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          NexisAI
                        </Link>
                      )}
                      {content?.wordpress_url && (
                        <a
                          href={content.wordpress_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Blog
                        </a>
                      )}
                      {content?.devto_url && (
                        <a
                          href={content.devto_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          dev.to
                        </a>
                      )}
                      {forumList.map((topic) => (
                        <a
                          key={topic.slug}
                          href={forumTopicUrl(topic.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Forum
                        </a>
                      ))}
                      {!slug && (
                        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#64748b]">
                          İçerik henüz yok
                        </span>
                      )}
                    </div>
                  </div>

                  {content?.title && (
                    <p className="mt-4 text-sm text-[#94a3b8]">{content.title}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="lf-card-surface p-10 text-center text-sm text-[#94a3b8]">
            Henüz kampanya yok.
          </div>
        )}
      </main>
    </>
  );
}
