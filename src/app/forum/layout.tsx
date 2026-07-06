import FuturisticShell from "@/components/layout/FuturisticShell";

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FuturisticShell>{children}</FuturisticShell>;
}
