"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel";
import { formatCurrency, formatDate } from "@/lib/formatters";

type Props = {
  clinicName: string;
  clinicEmail: string;
  currentPlan: string;
  currentStatus: string;
  startedAt: Date | null;
  trialEndsAt: Date | null;
  expiresAt: Date | null;
  latestInvoice:
    | {
        dueDate: Date;
        amount: number;
      }
    | null
    | undefined;
};

export function SaasSubscriptionDetailsPanel({
  clinicName,
  clinicEmail,
  currentPlan,
  currentStatus,
  startedAt,
  trialEndsAt,
  expiresAt,
  latestInvoice,
}: Props) {
  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title="Ver detalhe da assinatura"
          aria-label="Ver detalhe da assinatura"
        >
          <Eye className="size-4" />
        </Button>
      </SidePanelTrigger>
      <SidePanelContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <SidePanelHeader>
          <SidePanelTitle>
            {clinicName}
          </SidePanelTitle>
          <SidePanelDescription>
            Detalhe operacional da assinatura SaaS da conta cliente.
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="detail-field">
              <p className="detail-field-label">
                E-mail da conta
              </p>
              <p className="detail-field-value">
                {clinicEmail}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Plano atual
              </p>
              <p className="detail-field-value">
                {currentPlan}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Status atual
              </p>
              <p className="detail-field-value">
                {currentStatus}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Última cobrança
              </p>
              <p className="detail-field-value">
                {latestInvoice
                  ? `${formatDate(latestInvoice.dueDate)} · ${formatCurrency(latestInvoice.amount)}`
                  : "Sem cobrança emitida"}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Início
              </p>
              <p className="detail-field-value">
                {formatDate(startedAt)}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Trial até
              </p>
              <p className="detail-field-value">
                {formatDate(trialEndsAt)}
              </p>
            </div>
            <div className="detail-field md:col-span-2">
              <p className="detail-field-label">
                Expiração prevista
              </p>
              <p className="detail-field-value">
                {formatDate(expiresAt)}
              </p>
            </div>
          </div>
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
