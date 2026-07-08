export interface CampaignBrief {
  businessName: string;
  category: string;
  city: string;
  boneQuestions: string[];
  productDescription?: string | null;
}

export function formatBoneQuestions(questions: string[]): string {
  return questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
}

export function formatCategoryContext(brief: CampaignBrief): string {
  if (brief.productDescription?.trim()) {
    return `Kategori: ${brief.category}\nÜretilen ürün/hizmet: ${brief.productDescription.trim()}`;
  }

  return `Kategori: ${brief.category}`;
}

export function buildManufacturerBoneQuestions(
  productDescription: string,
  city: string,
  businessName: string,
): string[] {
  const product = productDescription.trim();

  return [
    `${city} bölgesinde ${product} üreten firma önerir misiniz?`,
    `Toptan ${product} tedarikçisi arıyorum, güvenilir üretici var mı?`,
    `${product} üretimi yapan yerel fabrika tavsiyesi lazım`,
    `${businessName} ${product} konusunda iyi mi, deneyimi olan var mı?`,
    `${city}'de ${product} kalitesi yüksek üretici firma kim?`,
    `Özel ${product} üretimi yaptırabileceğim firma arıyorum`,
  ];
}

export const PARAPHRASE_RULE =
  "Diğer kanallarda üretilecek metinlerle aynı cümleleri, başlıkları veya paragraf kalıplarını KULLANMA. Aynı konuyu tamamen farklı kelimelerle yeniden anlat.";

export function businessNameVisibilityRule(businessName: string): string {
  return `"${businessName}" işletme adı başlıkta ve gövde metninde en az 3 kez doğal biçimde geçmeli. İşletmeyi örnek/vaka olarak anlat; marka adını gizleme veya sadece genel sektör yazısı üretme.`;
}

export function includesBusinessName(
  text: string,
  businessName: string,
): boolean {
  const name = businessName.trim().toLowerCase();
  if (!name) return false;
  return text.toLowerCase().includes(name);
}
