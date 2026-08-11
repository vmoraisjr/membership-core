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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_16%,transparent),transparent_68%)]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-[1.25rem] border border-white/70 bg-[rgba(255,255,255,0.9)] px-6 py-8 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:px-8 sm:py-10">
        <div className="flex justify-center">
          <SheepLockup
            iconClassName="h-11 w-11"
            wordmarkClassName="text-xl"
          />
        </div>

        <div className="mt-8 space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {message ? (
          <div
            role={messageTone === "danger" ? "alert" : "status"}
            className={cn(
              "mt-5 rounded-2xl border px-4 py-3 text-sm",
              MESSAGE_TONE_CLASS[messageTone]
            )}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}
