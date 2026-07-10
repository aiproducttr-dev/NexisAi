import FuturisticShell from "@/components/layout/FuturisticShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FuturisticShell>{children}</FuturisticShell>;
}
