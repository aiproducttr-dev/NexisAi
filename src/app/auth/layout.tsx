import FuturisticShell from "@/components/layout/FuturisticShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FuturisticShell>{children}</FuturisticShell>;
}
