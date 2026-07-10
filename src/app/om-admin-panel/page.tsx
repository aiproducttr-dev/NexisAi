import AdminPanelLogin from "@/components/admin/AdminPanelLogin";
import AdminPublishedContents from "@/components/admin/AdminPublishedContents";
import { isAdminPanelAuthenticated } from "@/lib/auth/admin-panel";

export default async function OmAdminPanelPage() {
  const authed = await isAdminPanelAuthenticated();

  if (!authed) {
    return <AdminPanelLogin />;
  }

  return <AdminPublishedContents />;
}
