import Link from "next/link";

import { minhaEmpresaUrl } from "@/lib/company-routes";

export function ClinicPlanActivationRequired() {
  return (
    <div className="rounded-2xl border border-dashed p-6">
      <h2 className="text-lg font-semibold">
        Operação aguardando regularização do plano
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Os módulos de operação ficam disponíveis quando a assinatura da
        plataforma está em teste ou ativa. Acesse Minha empresa {"->"}{" "}
        Assinatura para atualizar o cartão ou entender o que está pendente.
      </p>
      <Link
        href={minhaEmpresaUrl({
          tab: "subscription",
        })}
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Ver assinatura
      </Link>
    </div>
  );
}
