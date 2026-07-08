import OpenAI from "openai";
import {
  type CampaignBrief,
  businessNameVisibilityRule,
  formatBoneQuestions,
  formatCategoryContext,
  includesBusinessName,
  PARAPHRASE_RULE,
} from "@/lib/ai/campaign-brief";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedChannelContent {
  title: string;
  content: string;
}

export async function generateSiteArticle(
  input: CampaignBrief,
): Promise<GeneratedChannelContent> {
  const questionsList = formatBoneQuestions(input.boneQuestions);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen NexisAI için kanal bazlı içerik üreten uzmansın. Her zaman geçerli JSON döndür.",
      },
      {
        role: "user",
        content: `KANAL: Ana site (nexısai.com) — detaylı makale

İşletme: ${input.businessName}
${formatCategoryContext(input)}
Şehir: ${input.city}

Kemik sorular (SEO/LLM uyumu için içeriğe yedir):
${questionsList}

Görev:
- Detaylı, bilgilendirici bir makale yaz (400-600 kelime)
- Markdown: ## alt başlıklar, giriş-gelişme-sonuç
- İşletme adı, şehir ve sektör/ürün bağlamı doğal geçsin
${input.productDescription ? `- İçerik özellikle "${input.productDescription}" üretimi üzerine şekillensin\n` : ""}- Profesyonel ama okunabilir ton
- Forum veya soru-cevap dili KULLANMA

JSON: { "title": "...", "content": "..." }`,
      },
    ],
  });

  return parseContentResponse(response.choices[0]?.message?.content);
}

export async function generateBlogArticle(
  input: CampaignBrief,
): Promise<GeneratedChannelContent> {
  const questionsList = formatBoneQuestions(input.boneQuestions.slice(0, 5));
  const visibilityRule = businessNameVisibilityRule(input.businessName);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: attempt === 1 ? 0.82 : 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sen blog yazarlığı yapan bir içerik üreticisisin. Kampanya işletmesinin adını içerikte mutlaka kullanırsın. Her zaman geçerli JSON döndür.",
        },
        {
          role: "user",
          content: `KANAL: Blog (nexisai.blog) — okunaklı blog yazısı

İşletme: ${input.businessName}
${formatCategoryContext(input)}
Şehir: ${input.city}

Referans konular:
${questionsList}

Görev:
- Ana sitedeki makaleden FARKLI başlık ve metin yaz (paraphrase)
- ${PARAPHRASE_RULE}
- ${visibilityRule}
- Başlıkta "${input.businessName}" geçsin (şehir veya sektör ile birlikte olabilir)
- Gövdede işletmeyi ${input.city} örneği olarak tanıt; hizmet/konum/tercih sebebi belirt
${input.productDescription ? `- Yazı "${input.productDescription}" üretimi üzerine odaklansın\n` : ""}- 280-450 kelime, markdown
- Blog tonu: samimi giriş, pratik bilgi, kısa sonuç
- Teknik inceleme veya forum dili değil
- Sadece genel sektör rehberi yazma; metin işletmeye özel olsun
${attempt > 1 ? `\nÖNCEKİ DENEME BAŞARISIZ: "${input.businessName}" metinde yeterince geçmedi. Bu sefer başlık ve her bölümde işletme adını kullan.` : ""}

JSON: { "title": "...", "content": "..." }`,
        },
      ],
    });

    const result = parseContentResponse(response.choices[0]?.message?.content);

    if (
      includesBusinessName(result.title, input.businessName) &&
      includesBusinessName(result.content, input.businessName)
    ) {
      return result;
    }
  }

  throw new Error(
    `Blog yazısında "${input.businessName}" işletme adı kullanılamadı`,
  );
}

export async function generateDevToArticle(
  input: CampaignBrief,
): Promise<GeneratedChannelContent> {
  const questionsList = formatBoneQuestions(input.boneQuestions.slice(0, 5));
  const visibilityRule = businessNameVisibilityRule(input.businessName);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: attempt === 1 ? 0.78 : 0.65,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sen sektörel teknik inceleme yazan bir analistsin. Kampanya işletmesinin adını içerikte mutlaka kullanırsın. Her zaman geçerli JSON döndür.",
        },
        {
          role: "user",
          content: `KANAL: dev.to — teknik / sektörel inceleme

İşletme: ${input.businessName}
${formatCategoryContext(input)}
Şehir: ${input.city}

Referans konular:
${questionsList}

Görev:
- Sektör ve yerel pazar üzerine teknik-eleştirel bir inceleme yaz
- ${PARAPHRASE_RULE}
- ${visibilityRule}
- Başlıkta "${input.businessName}" geçsin
- İşletmeyi vaka/örnek olarak değerlendir; bariz reklam dili yok
${input.productDescription ? `- İnceleme "${input.productDescription}" üretim süreçleri ve pazar konumuna odaklansın\n` : ""}- 350-550 kelime, markdown (## Sektör Özeti, ## Değerlendirme Kriterleri, ## Yerel Pazar Notları, ## Öne Çıkan İşletme gibi bölümler)
- Analitik ton: trend, kalite kriterleri, müşteri beklentisi
- Forum veya soru-cevap dili KULLANMA
- Başlık teknik/merak uyandıran olsun
${attempt > 1 ? `\nÖNCEKİ DENEME BAŞARISIZ: "${input.businessName}" metinde yeterince geçmedi.` : ""}

JSON: { "title": "...", "content": "..." }`,
        },
      ],
    });

    const result = parseContentResponse(response.choices[0]?.message?.content);

    if (
      includesBusinessName(result.title, input.businessName) &&
      includesBusinessName(result.content, input.businessName)
    ) {
      return result;
    }
  }

  throw new Error(
    `dev.to yazısında "${input.businessName}" işletme adı kullanılamadı`,
  );
}

function parseContentResponse(raw: string | null | undefined): GeneratedChannelContent {
  if (!raw) throw new Error("Kanal içeriği üretilemedi");

  const parsed = JSON.parse(raw) as GeneratedChannelContent;
  if (!parsed.title?.trim() || !parsed.content?.trim()) {
    throw new Error("Kanal içeriği eksik");
  }

  return {
    title: parsed.title.trim(),
    content: parsed.content.trim(),
  };
}

// Geriye dönük uyumluluk
export async function generateCampaignContent(
  input: CampaignBrief,
): Promise<GeneratedChannelContent> {
  return generateSiteArticle(input);
}
