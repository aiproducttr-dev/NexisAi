import {
  FREE_TRIAL_ALREADY_USED_MESSAGE,
  generateTrialPassword,
  normalizeTrialBusinessName,
  normalizeTrialEmail,
} from "@/lib/auth/free-trial";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const businessName = String(body.businessName || "").trim();
    const email = normalizeTrialEmail(String(body.email || ""));

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

    const businessNormalized = normalizeTrialBusinessName(businessName);
    const admin = createAdminClient();

    const { data: emailClaim } = await admin
      .from("free_trial_claims")
      .select("id")
      .eq("email_normalized", email)
      .limit(1)
      .maybeSingle();

    const { data: businessClaim } = await admin
      .from("free_trial_claims")
      .select("id")
      .eq("business_name_normalized", businessNormalized)
      .limit(1)
      .maybeSingle();

    if (emailClaim || businessClaim) {
      return NextResponse.json(
        { error: FREE_TRIAL_ALREADY_USED_MESSAGE },
        { status: 409 },
      );
    }

    const password = generateTrialPassword();

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: businessName,
          registration_source: "nexisai",
          used_free_trial: true,
          trial_business_name: businessName,
        },
      });

    if (createError) {
      const message = createError.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json(
          { error: FREE_TRIAL_ALREADY_USED_MESSAGE },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = created.user?.id;
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
        registration_source: "nexisai",
        used_free_trial: true,
        trial_business_name: businessName,
      })
      .select("id, email, full_name")
      .single();

    const profileOk =
      !profileError &&
      !!profile?.id &&
      profile.id === userId &&
      !!profile.email;

    if (!profileOk) {
      console.error("Free trial profile upsert failed:", profileError);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          error:
            "Profil oluşturulamadı. Lütfen tekrar deneyin. Hesabınız kaydedilmedi.",
        },
        { status: 500 },
      );
    }

    const { error: claimInsertError } = await admin
      .from("free_trial_claims")
      .insert({
        user_id: userId,
        email_normalized: email,
        business_name_normalized: businessNormalized,
        business_name: businessName,
      });

    if (claimInsertError) {
      console.error("Free trial claim insert failed:", claimInsertError);
      // Unique violation = race / double key
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: FREE_TRIAL_ALREADY_USED_MESSAGE },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      email,
      password,
      businessName,
      redirectTo: `/dashboard/new?trial=1&business=${encodeURIComponent(businessName)}`,
    });
  } catch (err) {
    console.error("Free trial register error:", err);
    return NextResponse.json(
      { error: "Ücretsiz deneme başlatılamadı" },
      { status: 500 },
    );
  }
}
