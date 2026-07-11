import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Confirms the authenticated caller's own email only.
 * Rejects anonymous or mismatched userId requests.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      userId?: string;
    } | null;

    const requestedUserId = body?.userId?.trim();

    if (!requestedUserId) {
      return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });
    }

    // Ownership check: caller may only confirm their own account
    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: authUser, error: lookupError } =
      await admin.auth.admin.getUserById(user.id);

    if (lookupError || !authUser.user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    if (authUser.user.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Onaylama başarısız" }, { status: 500 });
  }
}
