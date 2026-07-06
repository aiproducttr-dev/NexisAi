import OpenAI from "openai";

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
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function generateForumQuestions(
  input: GenerateForumQuestionsInput
): Promise<GeneratedForumQuestion[]> {
  const selected = pickRandom(input.boneQuestions, input.count);

  if (selected.length === 0) {
    return [
      {
        title: `${input.city}'de ${input.category} önerisi arıyorum`,
        body: `Selamlar, ${input.city} tarafında güvenilir ${input.category} hizmeti arayan var mı? Deneyimi olan varsa tavsiye bekliyorum.`,
        authorName: "merakli_kullanici",
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
        content: `Aşağıdaki kemik soruları, ${input.city} şehrinde yaşayan gerçek birinin NexisAI Form adlı forumda sorduğu doğal sorulara dönüştür.

Sektör: ${input.category}
Şehir: ${input.city}

Kemik sorular:
${seedList}

Kurallar:
- Her kemik soru için 1 forum sorusu üret (toplam ${selected.length} adet)
- Başlık kısa ve tıklanabilir olsun (maks 90 karakter)
- Gövde metni samimi, günlük Türkçe olsun; "arkadaşlar", "selamlar", "acaba", "yardımcı olur musunuz" gibi ifadeler kullanılabilir
- Reklam veya marka tanıtımı yapma; gerçek bir kullanıcının tavsiye istediği soru gibi olsun
- İşletme adı kullanma
- authorName: Türkçe forum takma adı (ör: aysee_34, mehmet_k, zeynep_ankara)
- sourceQuestion: ilham alınan kemik sorunun aynısı

JSON:
{
  "questions": [
    {
      "title": "...",
      "body": "...",
      "authorName": "...",
      "sourceQuestion": "..."
    }
  ]
}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Forum soruları üretilemedi");

  const parsed = JSON.parse(raw) as { questions: GeneratedForumQuestion[] };
  if (!parsed.questions?.length) {
    throw new Error("Forum soru listesi boş");
  }

  return parsed.questions;
}

export function forumQuestionCountForCampaign(days: number): number {
  return Math.min(5, Math.max(1, Math.ceil(days / 6)));
}
