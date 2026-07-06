import HomeLanding from "@/components/dashboard/HomeLanding";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nexisai",
  alternateName: ["nexısai", "NexisAI", "nexisai"],
  url: "https://nexisai.com",
  logo: "https://nexisai.com/logo.png",
  description:
    "İşletmenizi yapay zeka arama motorlarında tavsiye edilen seçenekler arasına taşıyan tam otomatik GEO reklam ve veri platformu.",
  sameAs: ["https://nexisaiform.com"],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <div className="relative min-h-screen overflow-x-hidden bg-[#050505]">
        <HomeLanding />
      </div>
    </>
  );
}
