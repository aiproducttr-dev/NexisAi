import { resolveRegistrationSource } from "@/lib/auth/registration-source";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, redirect, registrationSource } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "E-posta, şifre ve ad soyad gerekli" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      );
    }

    const source = resolveRegistrationSource({
      redirect,
      registrationSource,
      host: request.headers.get("host"),
      referer: request.headers.get("referer"),
    });

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: String(fullName).trim(),
        registration_source: source,
      },
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
        registration_source: source,
      });
    }

    return NextResponse.json({ success: true, registrationSource: source });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
