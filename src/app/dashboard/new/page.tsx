import CampaignWizard from "@/components/campaign/CampaignWizard";
import AppNav from "@/components/layout/AppNav";
import DashboardActions from "@/components/dashboard/DashboardActions";

export default function NewCampaignPage() {
  return (
    <>
      <AppNav
        backLink={{ href: "/dashboard", label: "Dashboard" }}
        right={<DashboardActions />}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
