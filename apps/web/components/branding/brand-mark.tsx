import Image from "next/image";

import {
  SHEEP_LOGO_PATH,
  type WorkspaceBrand,
} from "@/lib/branding";

type Props = {
  brand?: Pick<
    WorkspaceBrand,
    "displayName" | "subtitle" | "logoUrl"
  >;
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandMark({
  brand,
  compact = false,
  iconOnly = false,
}: Props) {
  const logoUrl =
    brand?.logoUrl || SHEEP_LOGO_PATH;
  const logoSizeClass = compact
    ? "h-11 w-11"
    : "h-14 w-14";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-[var(--shadow-xs)] ${logoSizeClass}`}
      >
        <Image
          src={logoUrl}
          alt={brand?.displayName ?? "Sheep"}
          width={compact ? 44 : 56}
          height={compact ? 44 : 56}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
      <div
        className={`min-w-0 ${iconOnly ? "sr-only" : ""}`}
      >
        <div
          className={
            compact
              ? "truncate text-sm font-semibold tracking-tight text-foreground"
              : "truncate font-semibold tracking-tight text-foreground"
          }
        >
          {brand?.displayName ?? "Sheep"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {brand?.subtitle}
        </div>
      </div>
    </div>
  );
}
