"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel";
import { useTranslations } from "@/i18n/provider";

import { saveClinicBillingPlanAction } from "@/features/modules/actions/save-clinic-billing-plan";
import { getFeedbackErrorMessage } from "@/lib/feedback";

import { PlatformPlanForm } from "./platform-plan-form";

type Props = {
  mode?: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    monthlyPrice: number | null;
    annualPrice: number | null;
    trialDays: number;
    active: boolean;
  } | null;
  trigger?: React.ReactNode;
};

export function PlatformPlanSidePanel({
  mode = "create",
  initialData,
  trigger,
}: Props) {
  const t = useTranslations();
  const defaultTrigger = (
    <Button>
      {t("billing.catalogPage.newPlan")}
    </Button>
  );
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] =
    useTransition();

  function handleSubmit(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        await saveClinicBillingPlanAction(
          formData
        );
        setOpen(false);
        toast.success(
          mode === "create"
            ? "Plano comercial criado com sucesso."
            : "Plano comercial atualizado com sucesso."
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível salvar o plano comercial."
          )
        );
      }
    });
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={setOpen}
    >
      <SidePanelTrigger asChild>
        {trigger ?? defaultTrigger}
      </SidePanelTrigger>
      <SidePanelContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <SidePanelHeader>
          <SidePanelTitle>
            {mode === "create"
              ? "Novo plano comercial"
              : "Editar plano comercial"}
          </SidePanelTitle>
          <SidePanelDescription>
            {mode === "create"
              ? "Cadastre um plano com nome, preços e janela de trial sem poluir a tela principal do catálogo."
              : "Revise preços, descrição e disponibilidade do plano selecionado."}
          </SidePanelDescription>
        </SidePanelHeader>

        <form
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <SidePanelBody>
            <div className="form-shell-body">
              <PlatformPlanForm
                initialData={
                  initialData ?? null
                }
              />
            </div>
          </SidePanelBody>
          <SidePanelFooter>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                {mode === "create"
                  ? "O novo plano ficará disponível para aplicação conforme a disponibilidade comercial definida."
                  : "As alterações do plano ficam refletidas na governança comercial da plataforma."}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  {mode === "create"
                    ? "Criar plano"
                    : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </SidePanelFooter>
        </form>
      </SidePanelContent>
    </SidePanel>
  );
}
