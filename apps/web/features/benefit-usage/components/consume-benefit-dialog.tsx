"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfinityIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { consumeBenefit } from "../actions/consume-benefit";
import {
  benefitUsageSchema,
  type BenefitUsageSchema,
} from "../schemas/benefit-usage.schema";

type BenefitBalance = {
  subscriptionId: string;
  patientId: string;
  patientName: string;
  membershipPlanId: string;
  membershipPlanName: string;
  membershipBenefitId: string;
  membershipBenefitTitle: string;
  usageLimit: number | null;
  resetPeriod: "MONTHLY" | "YEARLY" | null;
  usedQuantity: number;
  remainingQuantity: number | null;
};

type Props = {
  balances: BenefitBalance[];
  trigger?: React.ReactNode;
  title?: string;
};

export function ConsumeBenefitDialog({
  balances,
  trigger,
  title = "Registrar uso de benefício",
}: Props) {
  const [open, setOpen] = useState(false);

  const form =
    useForm<BenefitUsageSchema>({
      resolver: zodResolver(
        benefitUsageSchema
      ),
      defaultValues: {
        subscriptionId: "",
        membershipBenefitId: "",
        quantity: 1,
        usedBy: "",
        notes: "",
      },
    });

  const subscriptionId = useWatch({
    control: form.control,
    name: "subscriptionId",
  });

  const benefitOptions = useMemo(
    () =>
      balances.filter(
        (balance) =>
          balance.subscriptionId ===
          subscriptionId
      ),
    [balances, subscriptionId]
  );

  const selectedBenefitId = useWatch({
    control: form.control,
    name: "membershipBenefitId",
  });

  const selectedBalance =
    benefitOptions.find(
      (balance) =>
        balance.membershipBenefitId ===
        selectedBenefitId
    ) ?? null;

  useEffect(() => {
    if (
      benefitOptions.length === 0
    ) {
      form.setValue(
        "membershipBenefitId",
        ""
      );

      return;
    }

    const currentBenefitId =
      form.getValues(
        "membershipBenefitId"
      );

    const currentIsAvailable =
      benefitOptions.some(
        (balance) =>
          balance.membershipBenefitId ===
          currentBenefitId
      );

    if (!currentIsAvailable) {
      form.setValue(
        "membershipBenefitId",
        benefitOptions[0]
          .membershipBenefitId
      );
    }
  }, [benefitOptions, form]);

  async function onSubmit(
    values: BenefitUsageSchema
  ) {
    try {
      await consumeBenefit(values);

      toast.success(
        "Uso de benefício registrado."
      );

      form.reset({
        subscriptionId: "",
        membershipBenefitId: "",
        quantity: 1,
        usedBy: "",
        notes: "",
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o uso do benefício."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            Registrar uso
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
        </DialogHeader>

        {balances.length === 0 ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            Nenhuma assinatura ativa com benefícios disponíveis foi encontrada.
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(
              onSubmit
            )}
            className="flex flex-col gap-4"
          >
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Assinatura do paciente
              </label>
              <select
                {...form.register(
                  "subscriptionId"
                )}
                className="h-10 rounded-md border px-3"
              >
                <option value="">
                  Selecione uma assinatura
                </option>

                {Array.from(
                  new Map(
                    balances.map(
                      (balance) => [
                        balance.subscriptionId,
                        balance,
                      ]
                    )
                  ).values()
                ).map((balance) => (
                  <option
                    key={
                      balance.subscriptionId
                    }
                    value={
                      balance.subscriptionId
                    }
                  >
                    {balance.patientName}
                    {" - "}
                    {
                      balance.membershipPlanName
                    }
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Benefício
              </label>
              <select
                {...form.register(
                  "membershipBenefitId"
                )}
                className="h-10 rounded-md border px-3"
                disabled={
                  !subscriptionId
                }
              >
                <option value="">
                  Selecione um benefício
                </option>

                {benefitOptions.map(
                  (balance) => (
                    <option
                      key={
                        balance.membershipBenefitId
                      }
                      value={
                        balance.membershipBenefitId
                      }
                    >
                      {
                        balance.membershipBenefitTitle
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedBalance && (
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                <div className="font-medium">
                  Saldo atual
                </div>

                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  {selectedBalance.remainingQuantity == null ? (
                    <>
                      <InfinityIcon className="size-4" />
                      Uso sem limite
                    </>
                  ) : (
                    <>
                      {selectedBalance.remainingQuantity}
                      {" restante(s) de "}
                      {
                        selectedBalance.usageLimit
                      }
                      {selectedBalance.resetPeriod ===
                      "MONTHLY"
                        ? " no mês"
                        : " no total"}
                    </>
                  )}
                </div>

                {selectedBalance.resetPeriod && (
                  <div className="mt-1 text-muted-foreground">
                    Renovação mensal do limite.
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Quantidade
              </label>
              <Input
                type="number"
                min={1}
                {...form.register(
                  "quantity",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Utilizado por
              </label>
              <Input
                placeholder="Profissional ou membro da equipe"
                {...form.register(
                  "usedBy"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Observações
              </label>
              <Textarea
                rows={4}
                placeholder="Observações opcionais"
                {...form.register(
                  "notes"
                )}
              />
            </div>

            <Button type="submit">
              Registrar uso
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
