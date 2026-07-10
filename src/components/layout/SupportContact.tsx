import { SUPPORT_EMAIL } from "@/lib/constants/urls";

export default function SupportContact({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p className={`text-sm text-[#94a3b8] ${className}`}>
      Destek:{" "}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="font-medium text-cyan-400 transition hover:underline"
      >
        {SUPPORT_EMAIL}
      </a>
    </p>
  );
}
