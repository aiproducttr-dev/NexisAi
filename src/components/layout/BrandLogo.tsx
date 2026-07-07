import Image from "next/image";
import Link from "next/link";

export const LOGO_SRC = "/logo.png";

const sizeClasses = {
  sm: "h-12 w-auto",
  md: "h-14 w-auto sm:h-16",
  lg: "h-16 w-auto sm:h-20",
  xl: "h-20 w-auto sm:h-24",
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
        width={320}
        height={128}
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
