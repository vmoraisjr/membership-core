"use client";

import "./globals.css";

import { useEffect } from "react";

import { getTranslations } from "@/i18n/messages";
import { SHEEP_BRAND_SIGNATURE } from "@/lib/branding";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  const t = getTranslations();

  useEffect(() => {
    console.error(
      "[membership-core] global error boundary",
      error
    );
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {SHEEP_BRAND_SIGNATURE}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("errors.global.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "errors.global.description"
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-fit rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            {t("shared.actions.retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
