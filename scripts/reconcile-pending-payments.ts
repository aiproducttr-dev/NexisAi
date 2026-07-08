/**
 * Bekleyen iyzico ödemelerini iyzico API üzerinden doğrular.
 * Kullanım: npx tsx scripts/reconcile-pending-payments.ts
 */
import { loadEnv } from "./lib/load-env";
import { fulfillPaidCheckout } from "../src/lib/iyzico/fulfill-checkout";
import { reconcileCheckoutPayment } from "../src/lib/iyzico/reconcile";
import { createAdminClient } from "../src/lib/supabase/admin";

loadEnv();

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaign_checkouts")
    .select("id, business_name, payment_status, iyzico_token")
    .eq("payment_status", "pending")
    .not("iyzico_token", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) {
    console.log("Bekleyen ödeme yok.");
    return;
  }

  for (const row of rows) {
    console.log(`\nKontrol: ${row.business_name} (${row.id})`);
    try {
      const result = await reconcileCheckoutPayment(row.id);
      if (!result.paid) {
        console.log("  → iyzico: henüz başarılı değil", result.payment);
        continue;
      }

      console.log("  → ödeme doğrulandı, kampanya oluşturuluyor...");
      const fulfilled = await fulfillPaidCheckout(row.id);
      console.log(`  → tamam: /dashboard?created=${fulfilled.slug}`);
    } catch (err) {
      console.error("  → hata:", err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
