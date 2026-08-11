import {
  AlertTriangle,
  CheckCheck,
  WalletCards,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { getTranslations } from "@/i18n/messages";

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
  const t = getTranslations();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label={t(
          "billing.paymentsPage.metrics.issued"
        )}
        value={String(totalCount)}
        hint={t(
          "billing.paymentsPage.metrics.issuedHint"
        )}
        icon={<WalletCards className="size-5" />}
      />
      <MetricCard
        label={t(
          "billing.paymentsPage.metrics.pending"
        )}
        value={String(pendingCount)}
        hint={t(
          "billing.paymentsPage.metrics.pendingHint"
        )}
        icon={
          <AlertTriangle className="size-5" />
        }
      />
      <MetricCard
        label={t(
          "billing.paymentsPage.metrics.overdue"
        )}
        value={String(overdueCount)}
        hint={t(
          "billing.paymentsPage.metrics.overdueHint",
          { count: paidCount }
        )}
        icon={<CheckCheck className="size-5" />}
      />
    </div>
  );
}
