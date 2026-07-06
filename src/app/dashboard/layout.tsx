import FuturisticShell from "@/components/layout/FuturisticShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FuturisticShell>{children}</FuturisticShell>;
}
