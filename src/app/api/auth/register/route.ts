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
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(fullName).trim();

    if (!normalizedEmail || !normalizedName) {
      return NextResponse.json(
        { error: "E-posta, şifre ve ad soyad gerekli" },
        { status: 400 },
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
      email: normalizedEmail,
      password,
      // Mobile in-app browsers often block email verification links;
      // confirmed account allows immediate cookie session via signInWithPassword.
      email_confirm: true,
      user_metadata: {
        full_name: normalizedName,
        registration_source: source,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json(
          { error: "Bu e-posta adresi zaten kayıtlı" },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Kayıt oluşturulamadı" },
        { status: 500 },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: normalizedName,
        email: normalizedEmail,
        registration_source: source,
      })
      .select("id, email, full_name")
      .single();

    const profileOk =
      !profileError &&
      !!profile?.id &&
      profile.id === userId &&
      !!profile.email &&
      !!profile.full_name;

    if (!profileOk) {
      console.error("Profile upsert failed after createUser:", profileError);

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("Auth user rollback failed:", deleteError);
      }

      return NextResponse.json(
        {
          error:
            "Profil oluşturulamadı. Lütfen tekrar deneyin. Hesabınız kaydedilmedi.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      registrationSource: source,
      userId,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    console.error("Register route error:", err);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
