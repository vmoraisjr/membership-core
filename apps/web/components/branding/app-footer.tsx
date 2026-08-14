import { SHEEP_BRAND_SIGNATURE } from "@/lib/branding";

export function AppFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/94 px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-[var(--app-max-width)] items-center justify-end gap-4">
        <p className="text-right text-xs leading-5 text-muted-foreground">
          {SHEEP_BRAND_SIGNATURE}
        </p>
      </div>
    </footer>
  );
}
