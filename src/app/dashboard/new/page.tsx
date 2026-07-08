import CampaignWizard from "@/components/campaign/CampaignWizard";
import AppNav from "@/components/layout/AppNav";
import DashboardActions from "@/components/dashboard/DashboardActions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/dashboard/new");

  const { count: totalCampaignCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: existingCampaigns } = await supabase
    .from("campaigns")
    .select("id, business_name, content_slug, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const campaignCount = totalCampaignCount ?? 0;

  return (
    <>
      <AppNav
        logoHref="/dashboard"
        backLink={{ href: "/dashboard", label: "Kampanyalarım" }}
        right={<DashboardActions />}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {campaignCount > 0 && (
          <div className="lf-animate-in lf-animate-in-1 mb-8 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-cyan-100">
                {campaignCount === 1
                  ? "1 kampanyanız var."
                  : `${campaignCount} kampanyanız var${campaignCount > 5 ? " (son 5 gösteriliyor)" : ""}.`}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/10"
              >
                Tüm Kampanyaları Gör
              </Link>
            </div>
            <ul className="mt-3 space-y-2 border-t border-cyan-500/20 pt-3">
              {existingCampaigns?.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-white">
                    {campaign.business_name}
                  </span>
                  {campaign.content_slug && (
                    <Link
                      href={`/content/${campaign.content_slug}`}
                      className="text-cyan-300 hover:underline"
                    >
                      İçeriği görüntüle
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="lf-animate-in lf-animate-in-2 mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Kampanya Oluştur
          </p>
          <h1 className="lf-orbitron mt-2 text-3xl font-bold text-white sm:text-4xl">
            Yeni Kampanya
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#94a3b8]">
            İşletme bilgilerinizi girin, bütçenizi belirleyin ve kampanyanızı
            yayına alın.
          </p>
        </div>

        <div className="lf-card-border rounded-[20px] p-[2px]">
          <div className="lf-panel p-6 sm:p-10">
            <CampaignWizard />
          </div>
        </div>
      </main>
    </>
  );
}
