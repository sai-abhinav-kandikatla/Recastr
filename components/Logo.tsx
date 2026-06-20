import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const dims = { sm: 24, md: 28, lg: 36 };
const textSize = { sm: "14px", md: "16px", lg: "20px" };

export function Logo({ size = "md", className = "" }: LogoProps) {
  const dim = dims[size];

  return (
    <Link href="/" className={`logo-component inline-flex items-center gap-2 ${className}`.trim()} aria-label="Recastr home">
      <svg width={dim} height={dim} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="8" fill="currentColor" className="text-white" />
        <path
          d="M 9 7 H 18 C 21.5 7, 23 8.5, 23 11 C 23 13.5, 21.5 15, 18 15 H 13.5 V 25 H 9 Z M 13.5 10 V 12 H 17.5 C 18.5 12, 19.5 11.5, 19.5 11 C 19.5 10.5, 18.5 10, 17.5 10 Z M 13.5 15 H 18.5 L 22.5 25 H 18 Z"
          fill="#09090b"
        />
      </svg>
      <span className="logo-text font-semibold tracking-tight" style={{ fontSize: textSize[size] }}>
        Recastr
      </span>
    </Link>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#ffffff" />
      <path
        d="M 9 7 H 18 C 21.5 7, 23 8.5, 23 11 C 23 13.5, 21.5 15, 18 15 H 13.5 V 25 H 9 Z M 13.5 10 V 12 H 17.5 C 18.5 12, 19.5 11.5, 19.5 11 C 19.5 10.5, 18.5 10, 17.5 10 Z M 13.5 15 H 18.5 L 22.5 25 H 18 Z"
        fill="#09090b"
      />
    </svg>
  );
}
