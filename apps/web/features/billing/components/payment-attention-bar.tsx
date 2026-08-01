import {
  AlertTriangle,
  CheckCheck,
  WalletCards,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";

type Props = {
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  totalCount: number;
};

export function PaymentAttentionBar({
  overdueCount,
  paidCount,
  pendingCount,
  totalCount,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Cobranças emitidas"
        value={String(totalCount)}
        hint="Faturas SaaS acumuladas no contexto atual."
        icon={<WalletCards className="size-5" />}
      />
      <MetricCard
        label="Pendentes"
        value={String(pendingCount)}
        hint="Cobranças aguardando compensação ou ação operacional."
        icon={
          <AlertTriangle className="size-5" />
        }
      />
      <MetricCard
        label="Em atraso"
        value={String(overdueCount)}
        hint={`${paidCount} cobrança(s) já estão pagas no histórico filtrado.`}
        icon={<CheckCheck className="size-5" />}
      />
    </div>
  );
}
