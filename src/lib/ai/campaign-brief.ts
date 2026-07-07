export interface CampaignBrief {
  businessName: string;
  category: string;
  city: string;
  boneQuestions: string[];
}

export function formatBoneQuestions(questions: string[]): string {
  return questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
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
