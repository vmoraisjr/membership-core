"use client";

import { useState, useTransition } from "react";
import { Copy, LifeBuoy, Link2, RefreshCw, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getFeedbackErrorMessage } from "@/lib/feedback";

import { platformAddClinicBillingSupportNoteAction } from "../actions/platform-add-clinic-billing-support-note";
import { platformCheckClinicSubscriptionDivergenceAction } from "../actions/platform-check-clinic-subscription-divergence";
import { platformGenerateClinicPaymentLinkAction } from "../actions/platform-generate-clinic-payment-link";
import { platformResyncClinicSubscriptionAction } from "../actions/platform-resync-clinic-subscription";

type Props = {
  subscriptionId: string;
};

export function CompanyBillingSupportActions({
  subscriptionId,
}: Props) {
  const [isPending, startTransition] =
    useTransition();
  const [generatedLink, setGeneratedLink] =
    useState<{
      url: string;
      kind: "checkout" | "portal";
    } | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] =
    useState(false);
  const [noteDialogOpen, setNoteDialogOpen] =
    useState(false);

  function handleGenerateLink() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set(
          "subscriptionId",
          subscriptionId
        );
        const result =
          await platformGenerateClinicPaymentLinkAction(
            formData
          );
        setGeneratedLink(result);
        setLinkDialogOpen(true);
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível gerar o link."
          )
        );
      }
    });
  }

  function handleAddNote(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        await platformAddClinicBillingSupportNoteAction(
          formData
        );
        toast.success(
          "Nota registrada na linha do tempo."
        );
        setNoteDialogOpen(false);
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível salvar a nota."
          )
        );
      }
    });
  }

  async function copyLink() {
    if (!generatedLink) {
      return;
    }

    await navigator.clipboard.writeText(
      `${window.location.origin}${generatedLink.url}`
    );
    toast.success(
      "Link copiado para a área de transferência."
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        id="resync-clinic-subscription-form"
        action={
          platformResyncClinicSubscriptionAction
        }
      >
        <input
          type="hidden"
          name="subscriptionId"
          value={subscriptionId}
        />
      </form>
      <ConfirmSubmitButton
        formId="resync-clinic-subscription-form"
        size="sm"
        variant="outline"
        icon={
          <RefreshCw className="size-4" />
        }
        label="Solicitar sincronização"
        title="Solicitar sincronização com o provedor?"
        description="Consulta o estado real da assinatura no provedor e aplica só o que estiver divergente. Se já estiverem em sincronia, nada muda."
        actionLabel="Sincronizar"
      />

      <form
        id="check-clinic-subscription-divergence-form"
        action={
          platformCheckClinicSubscriptionDivergenceAction
        }
      >
        <input
          type="hidden"
          name="subscriptionId"
          value={subscriptionId}
        />
      </form>
      <ConfirmSubmitButton
        formId="check-clinic-subscription-divergence-form"
        size="sm"
        variant="outline"
        icon={
          <ShieldQuestion className="size-4" />
        }
        label="Verificar divergência"
        title="Verificar divergência com o provedor?"
        description={`Só marca se há divergência — não altera o status local. Use "Solicitar sincronização" depois para aplicar a correção.`}
        actionLabel="Verificar"
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleGenerateLink}
      >
        <Link2 className="size-4" />
        Gerar link de pagamento
      </Button>

      <Dialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
          >
            <LifeBuoy className="size-4" />
            Registrar nota de suporte
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nota de suporte
            </DialogTitle>
            <DialogDescription>
              Fica visível na timeline de
              auditoria desta empresa. Não
              inclua dado de cartão ou
              informação sensível do
              cliente.
            </DialogDescription>
          </DialogHeader>
          <form
            action={handleAddNote}
            className="grid gap-3"
          >
            <input
              type="hidden"
              name="subscriptionId"
              value={subscriptionId}
            />
            <Textarea
              name="note"
              required
              rows={4}
              maxLength={500}
              placeholder="Ex.: cliente avisou que vai atualizar o cartão até sexta."
            />
            <Button
              type="submit"
              disabled={isPending}
            >
              Salvar nota
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {generatedLink?.kind ===
              "portal"
                ? "Link do portal de pagamento"
                : "Link de checkout"}
            </DialogTitle>
            <DialogDescription>
              Copie e envie para a empresa
              pelo canal de suporte — a
              Sheep não completa o checkout
              nem acessa o portal em nome do
              cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              {generatedLink?.url}
            </code>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={copyLink}
              aria-label="Copiar link"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
