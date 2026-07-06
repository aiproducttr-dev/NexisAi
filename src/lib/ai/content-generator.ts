import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateContentInput {
  businessName: string;
  category: string;
  city: string;
  boneQuestions: string[];
}

interface GeneratedContent {
  title: string;
  content: string;
}

export async function generateCampaignContent(
  input: GenerateContentInput
): Promise<GeneratedContent> {
  const questionsList = input.boneQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");

  const prompt = `Sen NexisAI platformu için yapay zeka görünürlük içeriği üreten bir uzmansın.

İşletme Bilgileri:
- İşletme Adı: ${input.businessName}
- Kategori: ${input.category}
- Şehir: ${input.city}

Bu kategoriye ait kemik soru havuzu:
${questionsList}

Görevin:
1. Yukarıdaki soruları kategoriyle eşleştirerek SEO ve LLM görünürlüğü için optimize edilmiş bir içerik başlığı oluştur.
2. Başlığın altına, işletme adını (${input.businessName}), şehri (${input.city}) ve kategoriyi (${input.category}) doğal şekilde içeren, bilgilendirici ve profesyonel bir açıklama metni yaz.
3. İçerik Türkçe olmalı, 400-600 kelime arasında olmalı.
4. NexisAI platformu altında yayınlanacak şekilde yazılmalı.

Yanıtını şu JSON formatında ver:
{
  "title": "içerik başlığı",
  "content": "açıklamalı içerik metni (markdown formatında)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Sen profesyonel bir içerik üreticisisin. Her zaman geçerli JSON formatında yanıt ver.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI içerik üretilemedi");
  }

  const parsed = JSON.parse(raw) as GeneratedContent;

  if (!parsed.title || !parsed.content) {
    throw new Error("AI yanıtı eksik");
  }

  return parsed;
}
