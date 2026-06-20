import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};


const textSize = { sm: "14px", md: "16px", lg: "20px" };
const markSize = { sm: 20, md: 24, lg: 28 };

export function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <Link href="/" className={`logo-component inline-flex items-center gap-2.5 ${className}`.trim()} aria-label="Recastr home">
      <LogoMark size={markSize[size]} />
      <span className="logo-text font-bold tracking-tight" style={{ fontSize: textSize[size] }}>
        Recastr
      </span>
    </Link>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#ffffff" />
      <path
        d="M 9 8 H 19.5 C 21.5 8, 23 9.5, 23 12 C 23 14.5, 21.5 16, 19.5 16 H 13 V 24 H 9 Z M 13 11 H 19 C 20 11, 20.5 11.5, 20.5 12.5 C 20.5 13.5, 20 14, 19 14 H 13 Z M 15 16 H 19 L 23.5 24 H 19.5 L 15.5 17 Z"
        fill="#09090b"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

