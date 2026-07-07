/**
 * Eksik dev.to ve işletme adı geçmeyen WordPress yayınlarını onarır.
 * Kullanım: npx tsx scripts/repair-campaign-channels.ts [campaign_id]
 */
import { loadEnv } from "./lib/load-env";

loadEnv();

async function main() {
  const campaignId = process.argv[2];
  const { generateBlogArticle, generateDevToArticle } = await import(
    "../src/lib/ai/content-generator"
  );
  const { publishToDevTo } = await import("../src/lib/devto/publish-article");
  const { updateWordPressPost } = await import(
    "../src/lib/wordpress/publish-post"
  );
  const { createAdminClient } = await import("../src/lib/supabase/admin");

  const admin = createAdminClient();

  let query = admin
    .from("published_contents")
    .select(
      "id, slug, wordpress_post_id, wordpress_url, devto_url, campaigns!inner(id, business_name, category, city)",
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (campaignId) {
    query = admin
      .from("published_contents")
      .select(
        "id, slug, wordpress_post_id, wordpress_url, devto_url, campaigns!inner(id, business_name, category, city)",
      )
      .eq("campaign_id", campaignId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) {
    console.log("Onarılacak kampanya bulunamadı.");
    return;
  }

  for (const row of rows) {
    const campaign = Array.isArray(row.campaigns)
      ? row.campaigns[0]
      : row.campaigns;

    if (!campaign) continue;

    const brief = {
      businessName: campaign.business_name,
      category: campaign.category,
      city: campaign.city,
      boneQuestions: [
        `${campaign.category} sektöründe en iyi hizmeti kim sunar?`,
        `${campaign.city} bölgesinde ${campaign.category} alanında önerilen işletmeler hangileri?`,
        `${campaign.business_name} hakkında bilgi verir misiniz?`,
      ],
    };

    console.log(`\n=== ${campaign.business_name} ===`);

    if (row.wordpress_post_id) {
      try {
        const blogContent = await generateBlogArticle(brief);
        const wpResult = await updateWordPressPost(row.wordpress_post_id, {
          title: blogContent.title,
          content: blogContent.content,
          slug: row.slug,
          category: campaign.category,
          city: campaign.city,
          businessName: campaign.business_name,
        });
        console.log(`WordPress güncellendi: ${wpResult?.url ?? row.wordpress_url}`);
      } catch (wpError) {
        console.error("WordPress onarım hatası:", wpError);
      }
    }

    if (!row.devto_url) {
      try {
        const devtoContent = await generateDevToArticle(brief);
        const devtoResult = await publishToDevTo({
          title: devtoContent.title,
          content: devtoContent.content,
          slug: row.slug,
          category: campaign.category,
          city: campaign.city,
          businessName: campaign.business_name,
        });

        if (devtoResult) {
          await admin
            .from("published_contents")
            .update({
              devto_article_id: devtoResult.articleId,
              devto_url: devtoResult.url,
            })
            .eq("id", row.id);
          console.log(`dev.to yayınlandı: ${devtoResult.url}`);
        }
      } catch (devtoError) {
        console.error("dev.to onarım hatası:", devtoError);
      }
    } else {
      console.log(`dev.to zaten var: ${row.devto_url}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
