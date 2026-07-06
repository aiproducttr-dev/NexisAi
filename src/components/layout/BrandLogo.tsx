import Image from "next/image";
import Link from "next/link";

export const LOGO_SRC = "/logo.png";

const sizeClasses = {
  sm: "h-8 w-auto",
  md: "h-9 w-auto sm:h-10",
  lg: "h-12 w-auto",
} as const;

interface BrandLogoProps {
  href?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  suffix?: React.ReactNode;
  priority?: boolean;
}

export default function BrandLogo({
  href = "/",
  size = "md",
  className = "",
  suffix,
  priority = false,
}: BrandLogoProps) {
  const content = (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <Image
        src={LOGO_SRC}
        alt="NexisAI"
        width={160}
        height={64}
        priority={priority}
        className={`${sizeClasses[size]} shrink-0 drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]`}
      />
      {suffix}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="min-w-0">
      {content}
    </Link>
  );
}
