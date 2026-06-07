"use client";

import { useEffect } from "react";
import { useTranslations } from "@/i18n/provider";

type DashboardErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  const t = useTranslations();

  useEffect(() => {
    console.error(
      "[membership-core] dashboard error boundary",
      error
    );
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          {t("errors.dashboard.eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("errors.dashboard.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("errors.dashboard.description")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border px-4 py-2 text-sm font-medium"
        >
          {t("shared.actions.retry")}
        </button>
      </div>
    </div>
  );
}
