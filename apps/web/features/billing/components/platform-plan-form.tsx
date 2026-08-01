"use client";

import { Input } from "@/components/ui/input";

type Props = {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    monthlyPrice: number | null;
    annualPrice: number | null;
    trialDays: number;
    active: boolean;
  } | null;
};

export function PlatformPlanForm({
  initialData,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input
        type="hidden"
        name="planId"
        value={initialData?.id ?? ""}
      />

      <label className="field-stack md:col-span-2">
        <span className="field-label">
          Nome do plano
        </span>
        <Input
          name="name"
          required
          defaultValue={
            initialData?.name ?? ""
          }
          placeholder="Ex.: Sheep Growth"
        />
        <span className="field-help">
          Nome exibido na aplicação do plano para a empresa cliente.
        </span>
      </label>

      <label className="field-stack md:col-span-2">
        <span className="field-label">
          Descrição comercial
        </span>
        <Input
          name="description"
          defaultValue={
            initialData?.description ?? ""
          }
          placeholder="Resumo curto da proposta do plano"
        />
        <span className="field-help">
          Ajuda a diferenciar o posicionamento do plano no catálogo.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Preço mensal
        </span>
        <Input
          name="monthlyPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            initialData?.monthlyPrice ?? ""
          }
          placeholder="249.00"
        />
        <span className="field-help">
          Valor recorrente cobrado mês a mês.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Preço anual
        </span>
        <Input
          name="annualPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            initialData?.annualPrice ?? ""
          }
          placeholder="2490.00"
        />
        <span className="field-help">
          Valor total da contratação anual.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Trial em dias
        </span>
        <Input
          name="trialDays"
          type="number"
          min="0"
          defaultValue={
            initialData?.trialDays ?? 14
          }
        />
        <span className="field-help">
          Período de teste antes da cobrança efetiva.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Disponibilidade
        </span>
        <select
          name="active"
          defaultValue={
            initialData
              ? initialData.active
                ? "true"
                : "false"
              : "true"
          }
          className="field-select"
        >
          <option value="true">
            Ativo para novas vendas
          </option>
          <option value="false">
            Inativo no catálogo
          </option>
        </select>
        <span className="field-help">
          Controla se o plano pode ser aplicado em novas contas.
        </span>
      </label>
    </div>
  );
}
