import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional when env vars are already set
  }
}

loadEnv();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateQuestionsForCategory(categoryName: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.85,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen Türkiye'deki tüketicilerin gerçekten sorduğu doğal dilde sorular yazan bir uzmansın. Her zaman geçerli JSON döndür.",
      },
      {
        role: "user",
        content: `"${categoryName}" sektörü için insanların Google'da, forumlarda veya ChatGPT'ye sorabileceği tam 50 farklı soru üret.

Kurallar:
- Sorular günlük konuşma diliyle yazılsın (resmi olmasın)
- Her soru farklı bir ihtiyaç/senaryo hedeflesin (fiyat, güven, kalite, acil durum, tavsiye, karşılaştırma vb.)
- Şehir veya işletme adı kullanma; genel sorular olsun
- Soru işareti ile bitsin
- Tekrara düşme

JSON formatı:
{ "questions": ["soru 1?", "soru 2?", ...] }`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error(`Boş yanıt: ${categoryName}`);

  const parsed = JSON.parse(raw) as { questions: string[] };
  if (!parsed.questions?.length) {
    throw new Error(`Soru listesi boş: ${categoryName}`);
  }

  return parsed.questions.slice(0, 50);
}

async function main() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error || !categories?.length) {
    throw new Error(error?.message || "Kategori bulunamadı");
  }

  console.log(`${categories.length} kategori için kemik soru üretimi başlıyor...`);

  for (const category of categories) {
    console.log(`\n→ ${category.name}`);

    const questions = await generateQuestionsForCategory(category.name);

    await supabase
      .from("bone_questions")
      .delete()
      .eq("category_id", category.id);

    const rows = questions.map((question_text, index) => ({
      category_id: category.id,
      question_text: question_text.trim(),
      sort_order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from("bone_questions")
      .insert(rows);

    if (insertError) {
      throw new Error(`${category.name}: ${insertError.message}`);
    }

    console.log(`  ✓ ${rows.length} soru kaydedildi`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nTamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
