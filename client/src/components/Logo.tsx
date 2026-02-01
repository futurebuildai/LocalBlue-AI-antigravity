import { Link } from "wouter";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  linkTo?: string;
}

export function Logo({ size = "md", showWordmark = true, className = "", linkTo }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-lg", gap: "gap-2" },
    md: { icon: 32, text: "text-xl", gap: "gap-2.5" },
    lg: { icon: 40, text: "text-2xl", gap: "gap-3" },
  };

  const { icon, text, gap } = sizes[size];

  const logoContent = (
    <div className={`flex items-center ${gap} ${className}`} data-testid="logo">
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="text-white"
          style={{ width: icon * 0.65, height: icon * 0.65 }}
        >
          {/* House outline */}
          <path
            d="M3 10.5L12 3l9 7.5v10.5a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Upward growth arrow inside */}
          <path
            d="M12 17V10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 13l3-3 3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <span className={`font-semibold tracking-tight ${text}`}>
          <span className="text-foreground">Local</span>
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Blue</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        {/* House outline */}
        <path
          d="M3 10.5L12 3l9 7.5v10.5a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Upward growth arrow inside */}
        <path
          d="M12 17V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9 13l3-3 3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
