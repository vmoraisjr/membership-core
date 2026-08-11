"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

import { platformAssignClinicBillingPlanAction } from "../actions/platform-manage-clinic-subscription";

type Props = {
  subscriptionId: string;
  currentPlanId: string;
  currentPlanName: string;
  plans: Array<{ id: string; name: string }>;
};

export function PlatformPlanChangeDialog({
  subscriptionId,
  currentPlanId,
  currentPlanName,
  plans,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] =
    useState(currentPlanId);
  const selectedPlan = plans.find(
    (plan) => plan.id === selectedPlanId
  );
  const isChanged =
    selectedPlanId !== currentPlanId;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          setSelectedPlanId(currentPlanId);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <ArrowRightLeft className="size-4" />
          Trocar plano
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Trocar plano SaaS
          </DialogTitle>
          <DialogDescription>
            Plano atual:{" "}
            <strong className="text-foreground">
              {currentPlanName}
            </strong>
            . Escolha o novo plano e confirme
            para aplicar.
          </DialogDescription>
        </DialogHeader>

        <form
          action={
            platformAssignClinicBillingPlanAction
          }
          onSubmit={() => setOpen(false)}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="subscriptionId"
            value={subscriptionId}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Novo plano
            </label>
            <Select
              name="clinicBillingPlanId"
              value={selectedPlanId}
              onChange={(event) =>
                setSelectedPlanId(
                  event.target.value
                )
              }
            >
              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.name}
                </option>
              ))}
            </Select>
          </div>

          {isChanged ? (
            <p className="rounded-lg bg-[color:var(--color-warning-soft)] px-3 py-2 text-xs text-[color:var(--color-warning)]">
              Isso muda o plano de{" "}
              <strong>
                {currentPlanName}
              </strong>{" "}
              para{" "}
              <strong>
                {selectedPlan?.name}
              </strong>
              . A assinatura volta para o
              status &quot;Pendente&quot;
              até a próxima cobrança.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="submit"
              disabled={!isChanged}
            >
              Aplicar troca de plano
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
