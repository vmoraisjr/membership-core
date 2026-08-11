import type { ReactNode } from "react";

import { SheepLockup } from "@/components/branding/sheep-mark";
import { cn } from "@/lib/utils";

type MessageTone = "neutral" | "success" | "danger";

const MESSAGE_TONE_CLASS: Record<MessageTone, string> = {
  neutral: "border-border/60 bg-muted/40 text-foreground",
  success:
    "border-transparent bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
  danger:
    "border-transparent bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
};

type Props = {
  title: string;
  description: string;
  message?: ReactNode;
  messageTone?: MessageTone;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  title,
  description,
  message,
  messageTone = "neutral",
  children,
  footer,
}: Props) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-6 sm:px-6">
      <div className="auth-wash pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_16%,transparent),transparent_68%)]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-[1.25rem] border border-white/70 bg-[rgba(255,255,255,0.9)] px-6 py-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:px-7 sm:py-7">
        <div className="flex justify-center">
          <SheepLockup
            iconClassName="h-9 w-9"
            wordmarkClassName="text-lg"
          />
        </div>

        <div className="mt-4 space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h1>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        {message ? (
          <div
            role={messageTone === "danger" ? "alert" : "status"}
            className={cn(
              "mt-3 rounded-xl border px-3.5 py-2.5 text-xs",
              MESSAGE_TONE_CLASS[messageTone]
            )}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-4">{children}</div>

        {footer ? (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}
