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
