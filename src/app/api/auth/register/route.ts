import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "E-posta, şifre ve ad soyad gerekli" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalı" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: String(fullName).trim() },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json(
          { error: "Bu e-posta adresi zaten kayıtlı" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        full_name: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
