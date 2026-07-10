import { NextResponse } from "next/server";
import {
  getAdminPanelPassword,
  setAdminPanelSession,
  verifyAdminPanelPassword,
} from "@/lib/auth/admin-panel";

export async function POST(request: Request) {
  if (!getAdminPanelPassword()) {
    return NextResponse.json(
      { error: "Admin paneli yapılandırılmamış" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";

    if (!password || !verifyAdminPanelPassword(password)) {
      return NextResponse.json({ error: "Geçersiz şifre" }, { status: 401 });
    }

    await setAdminPanelSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Giriş başarısız" }, { status: 500 });
  }
}
