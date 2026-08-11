"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/provider";

type Props = {
  label: string;
};

export function AuthSubmitButton({ label }: Props) {
  const t = useTranslations();
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? t("shared.actions.processing") : label}
    </Button>
  );
}
