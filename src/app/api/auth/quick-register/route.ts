import { generateQuickRegisterPassword } from "@/lib/auth/quick-register";
import { resolveRegistrationSource } from "@/lib/auth/registration-source";
import { getSafeInternalPath } from "@/lib/auth/safe-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const businessName = String(body.businessName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const redirect = body.redirect;

    if (businessName.length < 2) {
      return NextResponse.json(
        { error: "İşletme adı en az 2 karakter olmalıdır" },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi girin" },
        { status: 400 },
      );
    }

    const source = resolveRegistrationSource({
      redirect,
      registrationSource: body.registrationSource,
      host: request.headers.get("host"),
      referer: request.headers.get("referer"),
    });

    const password = generateQuickRegisterPassword();
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: businessName,
        registration_source: source,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json(
          {
            error:
              "Bu e-posta adresi zaten kayıtlı. Lütfen Giriş Yap ile devam edin.",
          },
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
        full_name: businessName,
        email,
        registration_source: source,
      })
      .select("id, email, full_name")
      .single();

    const profileOk =
      !profileError &&
      !!profile?.id &&
      profile.id === userId &&
      !!profile.email;

    if (!profileOk) {
      console.error("Quick register profile upsert failed:", profileError);
      await admin.auth.admin.deleteUser(userId);
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
      email,
      password,
      businessName,
      userId,
      redirectTo: getSafeInternalPath(redirect, "/dashboard/new"),
    });
  } catch (err) {
    console.error("Quick register error:", err);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
