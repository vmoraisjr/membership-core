"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFeedbackErrorMessage } from "@/lib/feedback";

import { resetCompanyUserPasswordAction } from "../actions/reset-company-user-password";
import { sendCompanyUserPasswordEmailAction } from "../actions/send-company-user-password-email";

type Props = {
  userId: string;
  userEmail: string;
};

export function CompanyUserPasswordActions({
  userId,
  userEmail,
}: Props) {
  const [temporaryPassword, setTemporaryPassword] =
    useState("");
  const [passwordVisible, setPasswordVisible] =
    useState(false);
  const [isPending, setIsPending] =
    useState(false);

  async function handleReset() {
    setIsPending(true);

    try {
      const result =
        await resetCompanyUserPasswordAction(
          userId
        );

      setTemporaryPassword(
        result.temporaryPassword
      );
      setPasswordVisible(false);
      toast.success(
        `Senha temporária redefinida com sucesso para ${result.email}.`
      );
    } catch (error) {
      toast.error(
        getFeedbackErrorMessage(
          error,
          "Não foi possível redefinir a senha do usuário."
        )
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleSend() {
    if (!temporaryPassword) {
      return;
    }

    setIsPending(true);

    try {
      const result =
        await sendCompanyUserPasswordEmailAction(
          userId,
          temporaryPassword
        );

      toast.success(result.message);
    } catch (error) {
      toast.error(
        getFeedbackErrorMessage(
          error,
          "Não foi possível preparar o envio da senha temporária."
        )
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {temporaryPassword ? (
        <div className="relative">
          <Input
            readOnly
            type={
              passwordVisible
                ? "text"
                : "password"
            }
            value={temporaryPassword}
            className="h-8 w-40 pr-8 text-xs"
          />
          <button
            type="button"
            aria-label={
              passwordVisible
                ? "Ocultar senha temporária"
                : "Mostrar senha temporária"
            }
            onClick={() =>
              setPasswordVisible(
                (current) => !current
              )
            }
            className="absolute inset-y-0 right-0 inline-flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {passwordVisible ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => void handleReset()}
        title={`Restaurar senha de ${userEmail}`}
      >
        <RefreshCcw className="size-3.5" />
        Restaurar senha
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={
          isPending || !temporaryPassword
        }
        onClick={() => void handleSend()}
        title={`Enviar senha por e-mail para ${userEmail}`}
      >
        <Mail className="size-3.5" />
        Enviar senha
      </Button>
    </div>
  );
}
