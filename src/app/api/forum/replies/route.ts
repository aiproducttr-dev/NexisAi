import { forumDisplayName } from "@/lib/forum/organic-topic";
import { createClientFromRequest } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Cevap yazmak için giriş yapın" }, { status: 401 });
    }

    const { topicId, body } = await request.json();

    if (!topicId || !body?.trim()) {
      return NextResponse.json(
        { error: "Konu ve mesaj gerekli" },
        { status: 400 }
      );
    }

    if (body.trim().length < 3) {
      return NextResponse.json(
        { error: "Mesaj en az 3 karakter olmalı" },
        { status: 400 }
      );
    }

    const { data: topic } = await supabase
      .from("forum_topics")
      .select("id")
      .eq("id", topicId)
      .single();

    if (!topic) {
      return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const authorName = forumDisplayName(profile?.full_name, profile?.email);

    const { data: reply, error } = await supabase
      .from("forum_replies")
      .insert({
        topic_id: topicId,
        author_id: user.id,
        author_name: authorName,
        body: body.trim(),
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reply });
  } catch {
    return NextResponse.json({ error: "Cevap gönderilemedi" }, { status: 500 });
  }
}
