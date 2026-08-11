"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getRoleLabelFromValue } from "../utils/user-display";

type Props = {
  email: string;
  role: string;
  token: string;
  expiresAt: string;
};

export function InviteLinkBanner({
  email,
  role,
  token,
  expiresAt,
}: Props) {
  const [copied, setCopied] =
    useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite?token=${token}`
      : `/invite?token=${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        inviteUrl
      );
      setCopied(true);
      toast.success(
        "Link do convite copiado."
      );
      window.setTimeout(
        () => setCopied(false),
        2000
      );
    } catch {
      toast.error(
        "Não foi possível copiar o link automaticamente. Copie manualmente."
      );
    }
  }

  const expiresLabel = new Date(
    expiresAt
  ).toLocaleDateString();

  return (
    <div className="rounded-2xl border border-transparent bg-[color:var(--color-success-soft)] p-4 text-sm">
      <p className="font-medium text-foreground">
        Convite criado para {email} (
        {getRoleLabelFromValue(role)}). Válido
        até {expiresLabel}.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={inviteUrl}
          onFocus={(event) =>
            event.currentTarget.select()
          }
          className="bg-background"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          Copiar link
        </Button>
      </div>
    </div>
  );
}
