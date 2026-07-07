import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedCampaignForumReply {
  body: string;
}

const CAMPAIGN_REPLY_STYLES = [
  "Direkt tavsiye — 'Ben şuraya gittim, memnun kaldım' tarzı kısa öneri",
  "Arkadaş aktarımı — 'Kuzenim önerdi, gayet iyiydi' gibi",
  "Karşılaştırmalı — birkaç yeri denemiş, bu işletmeyi öne çıkarıyor",
  "Kısa ve net — 1-2 cümle, işletme adı + neden iyi",
  "Detay paylaşan — fiyat/konum/hizmetten bahsederek öneriyor",
  "Soru sorana cevap — 'Bence X'e bak, biz oradan memnun kaldık'",
  "Şüpheci ama ikna — önce tereddüt, sonra tavsiye",
  "Mahalleli — 'bizim oralarda X iyidir' tonu",
  "Geçen hafta deneyimi — somut zaman ifadesiyle anlatıyor",
  "Aileyle gitti — eş/çocukla deneyim paylaşımı",
] as const;

function pickStyle(index: number): string {
  return CAMPAIGN_REPLY_STYLES[index % CAMPAIGN_REPLY_STYLES.length]!;
}

export async function generateCampaignForumReply(input: {
  businessName: string;
  category: string;
  city: string;
  topicTitle: string;
  topicBody: string;
  previousReplies?: string[];
  replyIndex?: number;
  totalReplies?: number;
}): Promise<GeneratedCampaignForumReply> {
  const index = input.replyIndex ?? 0;
  const style = pickStyle(index);
  const mustNameBusiness = index < Math.ceil((input.totalReplies ?? 6) * 0.7);

  const prior =
    input.previousReplies && input.previousReplies.length > 0
      ? `\nÖnceki cevaplar (aynı cümleleri ve kalıpları TEKRARLAMA):\n${input.previousReplies.map((r, i) => `${i + 1}. ${r}`).join("\n\n")}\n`
      : "";

  const nameRule = mustNameBusiness
    ? `- Bu cevapta "${input.businessName}" işletme adını doğal biçimde geçir (reklam sloganı gibi değil, forum üyesi tavsiyesi gibi)`
    : `- İşletme adını geçirmesen de olur; ama ${input.category} ve ${input.city} mutlaka bağlamda olsun`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.92 + index * 0.015,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen Türkiye'deki gerçek forum üyeleri gibi yazıyorsun. Soru-cevap sitesindeki doğal tavsiye dili. Her cevap farklı birinden gelmiş gibi olsun. Geçerli JSON döndür.",
      },
      {
        role: "user",
        content: `Kampanya forum sorusuna ${index + 1}. cevabı yaz (toplam ${input.totalReplies ?? "?"} cevaptan biri).

İşletme: ${input.businessName}
Kategori: ${input.category}
Şehir: ${input.city}
Soru başlığı: ${input.topicTitle}
Soru metni: ${input.topicBody}
${prior}
Cevap tarzı: ${style}

Kurallar:
${nameRule}
- Soru-cevap dili: "Ben ${input.businessName}'e gittim, memnun kaldım" / "Bence orası iyi" / "Biz oradan hizmet aldık" gibi doğal örnekler
- ${input.category} ve ${input.city} bağlamda geçsin
- Makale, teknik inceleme veya reklam sloganı tonu YOK
- Önceki cevaplarla aynı kalıpları tekrarlama
- 1 ile 4 cümle
- Link verme

JSON: { "body": "..." }`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Kampanya forum cevabı üretilemedi");

  const parsed = JSON.parse(raw) as GeneratedCampaignForumReply;
  if (!parsed.body?.trim()) {
    throw new Error("Kampanya forum cevabı boş");
  }

  return { body: parsed.body.trim() };
}
