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
import { useTranslations } from "@/i18n/provider";
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
  const t = useTranslations();

  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={t(
            "billing.subscriptionsPage.detailsPanel.trigger"
          )}
          aria-label={t(
            "billing.subscriptionsPage.detailsPanel.trigger"
          )}
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
            {t(
              "billing.subscriptionsPage.detailsPanel.description"
            )}
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.detailsPanel.email"
                )}
              </p>
              <p className="detail-field-value">
                {clinicEmail}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.detailsPanel.currentPlan"
                )}
              </p>
              <p className="detail-field-value">
                {currentPlan}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.detailsPanel.currentStatus"
                )}
              </p>
              <p className="detail-field-value">
                {currentStatus}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.table.lastCharge"
                )}
              </p>
              <p className="detail-field-value">
                {latestInvoice
                  ? `${formatDate(latestInvoice.dueDate)} · ${formatCurrency(latestInvoice.amount)}`
                  : t(
                      "billing.subscriptionsPage.table.noChargeIssued"
                    )}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.table.start"
                )}
              </p>
              <p className="detail-field-value">
                {formatDate(startedAt)}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.table.trialUntil"
                )}
              </p>
              <p className="detail-field-value">
                {formatDate(trialEndsAt)}
              </p>
            </div>
            <div className="detail-field md:col-span-2">
              <p className="detail-field-label">
                {t(
                  "billing.subscriptionsPage.table.expiresAt"
                )}
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
