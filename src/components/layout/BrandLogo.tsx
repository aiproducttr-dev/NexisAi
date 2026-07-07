import Image from "next/image";
import Link from "next/link";

export const LOGO_SRC = "/logo.png";

const sizeClasses = {
  sm: "h-14 w-auto",
  md: "h-16 w-auto sm:h-20",
  lg: "h-20 w-auto sm:h-24",
  xl: "h-24 w-auto sm:h-28",
  "2xl": "h-28 w-auto sm:h-32",
} as const;

interface BrandLogoProps {
  href?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  suffix?: React.ReactNode;
  priority?: boolean;
  centered?: boolean;
}

export default function BrandLogo({
  href = "/",
  size = "md",
  className = "",
  suffix,
  priority = false,
  centered = false,
}: BrandLogoProps) {
  const content = (
    <div
      className={`flex min-w-0 items-center gap-2 sm:gap-3 ${
        centered ? "justify-center" : ""
      } ${className}`}
    >
      <Image
        src={LOGO_SRC}
        alt="NexisAI"
        width={400}
        height={160}
        priority={priority}
        className={`${sizeClasses[size]} shrink-0 drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]`}
      />
      {suffix}
    </div>
  );

  if (!href) {
    return (
      <div className={centered ? "mx-auto w-fit" : undefined}>{content}</div>
    );
  }

  return (
    <Link
      href={href}
      className={centered ? "mx-auto inline-flex w-fit" : "min-w-0"}
    >
      {content}
    </Link>
  );
}
