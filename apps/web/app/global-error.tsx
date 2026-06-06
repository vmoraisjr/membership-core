"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    console.error(
      "[membership-core] global error boundary",
      error
    );
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Membership Core
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600">
            The application hit an unexpected error. You can retry the current
            screen or return after reviewing the server logs and deployment
            checklist.
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
