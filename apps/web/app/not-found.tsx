import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/messages";

export default function NotFound() {
  const t = getTranslations();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          {t("errors.notFound.eyebrow")}
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {t("errors.notFound.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t(
            "errors.notFound.description"
          )}
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            {t(
              "errors.notFound.backToDashboard"
            )}
          </Link>
        </Button>
      </div>
    </div>
  );
}
