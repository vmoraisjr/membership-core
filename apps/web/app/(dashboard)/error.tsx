"use client";

import { useEffect } from "react";

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
          Dashboard error
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          We could not load this dashboard view
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Retry the request. If the problem persists, inspect the server logs,
          environment configuration and migration state before continuing with
          production testing.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
