"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/provider";

type RootErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function RootError({
  error,
  reset,
}: RootErrorProps) {
  const t = useTranslations();

  useEffect(() => {
    console.error(
      "[membership-core] root error boundary",
      error
    );
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          {t("errors.global.eyebrow")}
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {t("errors.global.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t(
            "errors.global.description"
          )}
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-6"
        >
          {t("shared.actions.retry")}
        </Button>
      </div>
    </div>
  );
}
