import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_PANEL_PATH = "/om-admin-panel";
export const ADMIN_PANEL_COOKIE = "nexisai_admin_panel";

function getSessionSecret(): string {
  return (
    process.env.NEXISAI_ADMIN_PANEL_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "nexisai-admin-panel-dev"
  );
}

export function getAdminPanelPassword(): string | null {
  const password = process.env.NEXISAI_ADMIN_PANEL_PASSWORD?.trim();
  return password || null;
}

export function createAdminPanelSessionToken(): string {
  return createHmac("sha256", getSessionSecret())
    .update("nexisai-admin-panel-session")
    .digest("hex");
}

export function verifyAdminPanelPassword(password: string): boolean {
  const expected = getAdminPanelPassword();
  if (!expected) return false;

  const input = Buffer.from(password);
  const target = Buffer.from(expected);
  if (input.length !== target.length) return false;

  return timingSafeEqual(input, target);
}

export async function isAdminPanelAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_PANEL_COOKIE)?.value;
  if (!token) return false;

  const expected = createAdminPanelSessionToken();
  const input = Buffer.from(token);
  const target = Buffer.from(expected);
  if (input.length !== target.length) return false;

  return timingSafeEqual(input, target);
}

export async function setAdminPanelSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PANEL_COOKIE, createAdminPanelSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminPanelSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_PANEL_COOKIE);
}
