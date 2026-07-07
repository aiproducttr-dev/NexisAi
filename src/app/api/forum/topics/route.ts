import { buildOrganicTopicSlug, forumDisplayName } from "@/lib/forum/organic-topic";
import { notifyForumTopicIndexNow } from "@/lib/indexnow/submit";
import { createClientFromRequest } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Soru sormak için giriş yapın" },
        { status: 401 }
      );
    }

    const { title, body, category, city } = await request.json();

    if (!title?.trim() || !body?.trim() || !category?.trim() || !city?.trim()) {
      return NextResponse.json(
        { error: "Başlık, mesaj, kategori ve şehir gerekli" },
        { status: 400 }
      );
    }

    if (title.trim().length < 5) {
      return NextResponse.json(
        { error: "Başlık en az 5 karakter olmalı" },
        { status: 400 }
      );
    }

    if (body.trim().length < 10) {
      return NextResponse.json(
        { error: "Mesaj en az 10 karakter olmalı" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const displayAuthor = forumDisplayName(profile?.full_name, profile?.email);
    const slug = buildOrganicTopicSlug(title.trim());

    const { data: topic, error } = await supabase
      .from("forum_topics")
      .insert({
        campaign_id: null,
        slug,
        title: title.trim(),
        body: body.trim(),
        category: category.trim(),
        city: city.trim(),
        business_name: "",
        content_slug: null,
        author_id: user.id,
        topic_type: "question",
        source_question: null,
        display_author_name: displayAuthor,
      })
      .select("id, slug, title")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    notifyForumTopicIndexNow(topic.slug);

    return NextResponse.json({ success: true, topic });
  } catch {
    return NextResponse.json({ error: "Konu oluşturulamadı" }, { status: 500 });
  }
}
