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
};

export function BrandMark({
  brand,
  compact = false,
}: Props) {
  const logoUrl =
    brand?.logoUrl || SHEEP_LOGO_PATH;

  return (
    <div className="flex items-center gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-[var(--shadow-xs)]">
        <Image
          src={logoUrl}
          alt={brand?.displayName ?? "Sheep"}
          width={compact ? 44 : 56}
          height={compact ? 44 : 56}
          style={{
            width: compact
              ? "2.75rem"
              : "3.5rem",
            height: compact
              ? "2.75rem"
              : "3.5rem",
          }}
          className={
            compact
              ? "object-contain"
              : "object-contain"
          }
          unoptimized
        />
      </div>
      <div className="min-w-0">
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
