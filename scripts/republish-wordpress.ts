/**
 * WordPress yazısını işletme adı geçecek şekilde yeniden üretir ve günceller.
 * Kullanım: npx tsx scripts/republish-wordpress.ts [campaign_id]
 */
import { loadEnv } from "./lib/load-env";

loadEnv();

async function main() {
  const campaignId = process.argv[2];
  const { generateBlogArticle } = await import("../src/lib/ai/content-generator");
  const { updateWordPressPost } = await import("../src/lib/wordpress/publish-post");
  const { createAdminClient } = await import("../src/lib/supabase/admin");

  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error("OPENAI_API_KEY tanımlı değil.");
    process.exit(1);
  }

  const admin = createAdminClient();

  let query = admin
    .from("published_contents")
    .select(
      "id, slug, wordpress_post_id, wordpress_url, campaigns!inner(id, business_name, category, city)",
    )
    .not("wordpress_post_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (campaignId) {
    query = admin
      .from("published_contents")
      .select(
        "id, slug, wordpress_post_id, wordpress_url, campaigns!inner(id, business_name, category, city)",
      )
      .eq("campaign_id", campaignId)
      .limit(1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const row = data?.[0];
  if (!row?.wordpress_post_id) {
    console.log("Güncellenecek WordPress yazısı bulunamadı.");
    return;
  }

  const campaign = Array.isArray(row.campaigns)
    ? row.campaigns[0]
    : row.campaigns;

  if (!campaign) {
    throw new Error("Kampanya bilgisi alınamadı");
  }

  console.log(
    `Kampanya: ${campaign.business_name} (${campaign.category}, ${campaign.city})`,
  );
  console.log("Blog içeriği üretiliyor...");

  const blogContent = await generateBlogArticle({
    businessName: campaign.business_name,
    category: campaign.category,
    city: campaign.city,
    boneQuestions: [
      `${campaign.category} sektöründe en iyi hizmeti kim sunar?`,
      `${campaign.city} bölgesinde ${campaign.category} alanında önerilen işletmeler hangileri?`,
      `${campaign.business_name} hakkında bilgi verir misiniz?`,
    ],
  });

  console.log(`Başlık: ${blogContent.title}`);
  console.log("WordPress güncelleniyor...");

  const result = await updateWordPressPost(row.wordpress_post_id, {
    title: blogContent.title,
    content: blogContent.content,
    slug: row.slug,
    category: campaign.category,
    city: campaign.city,
    businessName: campaign.business_name,
  });

  if (!result) {
    throw new Error("WordPress yapılandırması eksik");
  }

  console.log(`Tamamlandı: ${result.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
