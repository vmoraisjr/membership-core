"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useTranslations } from "@/i18n/provider";

export function OfflineBanner() {
  const t = useTranslations();
  const [isOffline, setIsOffline] =
    useState(
      () =>
        typeof navigator !==
          "undefined" &&
        typeof navigator.onLine ===
          "boolean" &&
        !navigator.onLine
    );

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
    }

    function handleOnline() {
      setIsOffline(false);
    }

    window.addEventListener(
      "offline",
      handleOffline
    );
    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "offline",
        handleOffline
      );
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-[color:var(--color-warning)] px-4 py-2 text-center text-sm font-medium text-white"
    >
      <WifiOff className="size-4 shrink-0" />
      <span>
        {t("offline.title")} —{" "}
        {t("offline.description")}
      </span>
    </div>
  );
}
