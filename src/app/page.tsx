import HomeLanding from "@/components/dashboard/HomeLanding";
import { APP_URL } from "@/lib/constants/urls";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nexisai",
  alternateName: ["nexısai", "NexisAI"],
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  description:
    "İşletmenizi yapay zeka arama motorlarında tavsiye edilen seçenekler arasına taşıyan tam otomatik GEO reklam ve veri platformu.",
  sameAs: ["https://nexisaiform.com"],
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ trial?: string; signup?: string }>;
}) {
  const params = await searchParams;
  const openTrialSignup = params.trial === "1" || params.signup === "1";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <div className="relative min-h-screen overflow-x-hidden bg-[#050505]">
        <HomeLanding openTrialSignup={openTrialSignup} />
      </div>
    </>
  );
}
