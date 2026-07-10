import FuturisticShell from "@/components/layout/FuturisticShell";

export default function OmAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FuturisticShell>{children}</FuturisticShell>;
}
