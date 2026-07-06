import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedForumReply {
  body: string;
}

const REPLY_PERSONAS = [
  "Çok kısa yazan biri — 1-2 cümle, selam vermeden direkt konuya gir",
  "Kişisel anı anlatan — geçen ay/hafta yaşadığı somut bir olay",
  "Emin olmayan — 'tam bilmiyorum ama' veya 'galiba' ile başlayan",
  "Karşı soru soran — soruyu cevaplamak yerine netleştirici soru soran",
  "Pratik ipucu veren — fiyat yerine nelere dikkat edilmeli anlatan",
  "Komşu/arkadaş referansı — 'arkadaşım şöyle dedi' tarzı",
  "Şikayetli deneyim — bir kez kötü/iyi deneyim paylaşan, abartmadan",
  "Tavsiye arayan — aslında kendisi de arıyormuş gibi samimi",
  "Sadece bir detay ekleyen — önceki cevapları tamamlayan kısa not",
  "Mizahi/samimi — günlük dil, hafif espri veya 'valla' gibi ifadeler",
] as const;

function pickPersona(index: number): string {
  return REPLY_PERSONAS[index % REPLY_PERSONAS.length]!;
}

export async function generateForumReply(input: {
  category: string;
  city: string;
  topicTitle: string;
  topicBody: string;
  previousReplies?: string[];
  replyIndex?: number;
  totalReplies?: number;
}): Promise<GeneratedForumReply> {
  const index = input.replyIndex ?? 0;
  const persona = pickPersona(index);

  const prior =
    input.previousReplies && input.previousReplies.length > 0
      ? `\nÖnceki cevaplar (aynı fikri, fiyat aralığını veya kalıbı TEKRARLAMA):\n${input.previousReplies.map((r, i) => `${i + 1}. ${r}`).join("\n\n")}\n`
      : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.95 + index * 0.02,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen Türk forumlarında yazan farklı karakterlere sahip gerçek üyeler gibi yazıyorsun. Her cevap birbirinden bariz şekilde farklı olmalı. Her zaman geçerli JSON döndür.",
      },
      {
        role: "user",
        content: `Forum sorusuna ${index + 1}. cevabı yaz (${input.totalReplies ?? "?"} cevaptan biri).

Kategori: ${input.category}
Şehir: ${input.city}
Soru başlığı: ${input.topicTitle}
Soru metni: ${input.topicBody}
${prior}
Bu cevabın karakteri: ${persona}

Zorunlu kurallar:
- Önceki cevaplarla aynı yapıyı kullanma (fiyat aralığı verildiyse sen verme; hepsi "Merhaba" ile başlıyorsa sen başlama)
- "Umarım işinize yarar", "ek işlemler ekstra ücret", "genelde X-Y TL arası" kalıplarını öncekiler kullandıysa KESİNLİKLE kullanma
- Fiyat söyleyeceksen tek bir net rakam veya tamamen farklı bir açı (sigorta, öğrenci indirimi, gece ücreti vb.)
- 1 ile 4 cümle arası; karaktere göre kısa veya uzun olsun
- Reklam, marka, işletme adı yok
- Her cevap farklı biri yazmış gibi dursun

JSON: { "body": "..." }`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Forum cevabı üretilemedi");

  const parsed = JSON.parse(raw) as GeneratedForumReply;
  if (!parsed.body?.trim()) {
    throw new Error("Forum cevabı boş");
  }

  return { body: parsed.body.trim() };
}
