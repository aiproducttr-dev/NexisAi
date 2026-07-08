import OpenAI from "openai";
import {
  type CampaignBrief,
  formatBoneQuestions,
  formatCategoryContext,
  PARAPHRASE_RULE,
} from "@/lib/ai/campaign-brief";
import { getCampaignContentPlan } from "@/lib/campaign/content-plan";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedForumQuestion {
  title: string;
  body: string;
  authorName: string;
  sourceQuestion: string;
}

interface GenerateForumQuestionsInput {
  category: string;
  city: string;
  boneQuestions: string[];
  count: number;
  productDescription?: string | null;
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function randomAuthorName(): string {
  const names = [
    "ayseyilmaz34",
    "mehmetkaya92",
    "zeynepdemir28",
    "canozturk41",
    "selinyildiz56",
    "burakcelik19",
    "emreaksoy73",
    "fatmakoc25",
  ];
  return names[Math.floor(Math.random() * names.length)]!;
}

/** Organik forum botu — genel tavsiye soruları */
export async function generateForumQuestions(
  input: GenerateForumQuestionsInput,
): Promise<GeneratedForumQuestion[]> {
  const selected = pickRandom(input.boneQuestions, input.count);

  if (selected.length === 0) {
    return [
      {
        title: `${input.city}'de ${input.category} önerisi arıyorum`,
        body: `Selamlar, ${input.city} tarafında güvenilir ${input.category} hizmeti arayan var mı? Deneyimi olan varsa tavsiye bekliyorum.`,
        authorName: randomAuthorName(),
        sourceQuestion: "fallback",
      },
    ];
  }

  const seedList = selected.map((q, i) => `${i + 1}. ${q}`).join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen Türk forumlarındaki gerçek kullanıcı gibi yazan bir metin yazarısın. Her zaman geçerli JSON döndür.",
      },
      {
        role: "user",
        content: `Aşağıdaki kemik soruları, ${input.city} şehrinde yaşayan gerçek birinin forumda sorduğu doğal sorulara dönüştür.

Sektör: ${input.category}
Şehir: ${input.city}

Kemik sorular:
${seedList}

Kurallar:
- Her kemik soru için 1 forum sorusu üret (toplam ${selected.length} adet)
- Başlık kısa ve tıklanabilir olsun (maks 90 karakter)
- Gövde metni samimi, günlük Türkçe olsun
- Reklam veya marka tanıtımı yapma; işletme adı kullanma
- authorName: isimsoyisim + sayı (ör: ayseyilmaz34)
- sourceQuestion: ilham alınan kemik sorunun aynısı

JSON:
{
  "questions": [
    { "title": "...", "body": "...", "authorName": "...", "sourceQuestion": "..." }
  ]
}`,
      },
    ],
  });

  return parseForumQuestions(response.choices[0]?.message?.content);
}

/** Kampanya forumu — doğal soru-cevap dili */
export async function generateCampaignForumQuestions(
  input: CampaignBrief & { count: number },
): Promise<GeneratedForumQuestion[]> {
  const selected = pickRandom(input.boneQuestions, input.count);

  if (selected.length === 0) {
    return [
      {
        title: `${input.city}'de ${input.category} için nereye gidilir?`,
        body: `Arkadaşlar ${input.city} tarafında ${input.category} konusunda güvenilir yer arıyorum. Deneyimi olan var mı?`,
        authorName: randomAuthorName(),
        sourceQuestion: "fallback",
      },
    ];
  }

  const seedList = formatBoneQuestions(selected);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.93,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen Türkiye'deki gerçek forum kullanıcıları gibi soru yazıyorsun. Soru-cevap sitesindeki doğal dil. JSON döndür.",
      },
      {
        role: "user",
        content: `KANAL: nexisaiform.com — tamamen doğal soru-cevap dili

İşletme (soruda GEÇMEYECEK): ${input.businessName}
${formatCategoryContext(input)}
Şehir: ${input.city}

Kemik sorular (ilham al, birebir kopyalama):
${seedList}

Görev: ${selected.length} adet forum sorusu üret.
${input.productDescription ? `\nSorular "${input.productDescription}" üretimi/tedariki hakkında olsun; ürün adı doğal geçsin.\n` : ""}
Başlık örnekleri:
- "${input.city}'de ${input.category} için nereye gidilir?"
- "${input.category} tavsiyesi lazım (${input.city})"
- "Acaba ${input.city} tarafında kimleri önerirsiniz?"

Gövde kuralları:
- 1-3 cümle, günlük konuşma Türkçesi
- "arkadaşlar", "selam", "acaba", "kim biliyor", "deneyimi olan" gibi ifadeler
- ${PARAPHRASE_RULE}
- Makale veya teknik inceleme tonu YOK
- İşletme adı ve marka YOK — sadece tavsiye isteyen gerçek kullanıcı
- authorName: isimsoyisim + 2 rakam
- sourceQuestion: ilham alınan kemik soru

JSON:
{
  "questions": [
    { "title": "...", "body": "...", "authorName": "...", "sourceQuestion": "..." }
  ]
}`,
      },
    ],
  });

  return parseForumQuestions(response.choices[0]?.message?.content);
}

function parseForumQuestions(
  raw: string | null | undefined,
): GeneratedForumQuestion[] {
  if (!raw) throw new Error("Forum soruları üretilemedi");

  const parsed = JSON.parse(raw) as { questions: GeneratedForumQuestion[] };
  if (!parsed.questions?.length) {
    throw new Error("Forum soru listesi boş");
  }

  return parsed.questions;
}

export function forumQuestionCountForCampaign(
  days: number,
  dailyBudget = 200,
): number {
  return getCampaignContentPlan(dailyBudget, days).forumQuestionCount;
}
