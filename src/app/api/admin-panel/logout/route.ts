import { NextResponse } from "next/server";
import { clearAdminPanelSession } from "@/lib/auth/admin-panel";

export async function POST() {
  await clearAdminPanelSession();
  return NextResponse.json({ success: true });
}
