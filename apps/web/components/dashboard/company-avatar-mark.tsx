"use client";

import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

type Props = {
  name: string;
  /** Stable value (e.g. an id). Kept for backwards compatibility with call sites; unused visually. */
  seed?: string;
  /** Company logo URL. Falls back to initials-only when absent or on load failure. */
  logoUrl?: string | null;
  className?: string;
};

export function CompanyAvatarMark({
  name,
  logoUrl,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-300 shadow-[var(--shadow-xs)]",
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
      {logoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            className="size-full object-contain"
            onError={(event) => {
              event.currentTarget.parentElement?.style.setProperty(
                "display",
                "none"
              );
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
