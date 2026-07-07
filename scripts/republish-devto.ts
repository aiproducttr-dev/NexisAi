/**
 * Eksik dev.to yayınlarını tamamlar.
 * Kullanım: npx tsx scripts/republish-devto.ts [campaign_id]
 */
import { loadEnv } from "./lib/load-env";

loadEnv();

async function main() {
  if (!process.env.DEV_TO_API_KEY?.trim()) {
    console.error("DEV_TO_API_KEY .env.local içinde tanımlı değil.");
    process.exit(1);
  }

  const { publishToDevTo } = await import("../src/lib/devto/publish-article");
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const campaignId = process.argv[2];
  const admin = createAdminClient();

  let query = admin
    .from("published_contents")
    .select(
      "id, campaign_id, slug, title, content, devto_url, campaigns!inner(id, business_name, category, city)",
    )
    .is("devto_url", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (campaignId) {
    query = admin
      .from("published_contents")
      .select(
        "id, campaign_id, slug, title, content, devto_url, campaigns!inner(id, business_name, category, city)",
      )
      .eq("campaign_id", campaignId)
      .limit(1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];
  if (!row) {
    console.log("Yeniden yayınlanacak kampanya bulunamadı.");
    return;
  }

  const campaign = Array.isArray(row.campaigns)
    ? row.campaigns[0]
    : row.campaigns;

  if (!campaign) {
    throw new Error("Kampanya bilgisi alınamadı");
  }

  if (row.devto_url) {
    console.log(`Zaten yayında: ${row.devto_url}`);
    return;
  }

  console.log(
    `Kampanya: ${campaign.business_name} (${campaign.category}, ${campaign.city})`,
  );
  console.log(`Slug: ${row.slug}`);
  console.log("dev.to'ya gönderiliyor...");

  const result = await publishToDevTo({
    title: row.title,
    content: row.content,
    slug: row.slug,
    category: campaign.category,
    city: campaign.city,
    businessName: campaign.business_name,
  });

  if (!result) {
    throw new Error("dev.to yayını null döndü (API anahtarı?)");
  }

  await admin
    .from("published_contents")
    .update({
      devto_article_id: result.articleId,
      devto_url: result.url,
    })
    .eq("id", row.id);

  console.log(`Tamamlandı: ${result.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
