"use client";

import {
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deactivateMembershipBenefit } from "../actions/deactivate-membership-benefit";
import { reactivateMembershipBenefit } from "../actions/reactivate-membership-benefit";
import { deleteMembershipBenefitPermanently } from "../actions/delete-membership-benefit-permanently";
import { useTranslations } from "@/i18n/provider";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type MembershipBenefitRowActionDTO = {
  id: string;
  membershipPlanId: string;
  active: boolean;
  type: BenefitType;
  title: string;
  description?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
  membershipPlan: {
    active: boolean;
  };
};

type Props = {
  benefit: MembershipBenefitRowActionDTO;

  plans: Array<{
    id: string;
    name: string;
  }>;

  planIsActive?: boolean;
  canManageBenefits?: boolean;
  canDeleteBenefitsPermanently?: boolean;
};

export function MembershipBenefitRowActions({
  benefit,
  plans,
  planIsActive = true,
  canManageBenefits = true,
  canDeleteBenefitsPermanently = true,
}: Props) {
  const t = useTranslations();

  async function handleDeactivate() {
    try {
      await deactivateMembershipBenefit(
        benefit.id
      );

      toast.success(
        t(
          "benefits.rowActions.deactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "benefits.rowActions.deactivateError"
            )
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateMembershipBenefit(
        benefit.id
      );

      toast.success(
        t(
          "benefits.rowActions.reactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "benefits.rowActions.reactivateError"
            )
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteMembershipBenefitPermanently(
        benefit.id
      );

      toast.success(
        t(
          "benefits.rowActions.deleteSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "benefits.rowActions.deleteError"
            )
      );
    }
  }

  if (!canManageBenefits) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("shared.states.readOnly")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {benefit.active &&
      planIsActive ? (
        <>
          <MembershipBenefitDialog
            mode="edit"
            initialData={benefit}
            plans={plans}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                title={t("shared.actions.edit")}
                aria-label={t(
                  "shared.actions.edit"
                )}
              >
                <Pencil className="size-4" />
              </Button>
            }
          />

          <ConfirmDialog
            title={t(
              "benefits.rowActions.deactivateTitle"
            )}
            description={t(
              "benefits.rowActions.deactivateDescription"
            )}
            onConfirm={() =>
              handleDeactivate()
            }
            actionLabel={t(
              "benefits.rowActions.deactivateAction"
            )}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
                title={t(
                  "benefits.rowActions.deactivateAction"
                )}
                aria-label={t(
                  "benefits.rowActions.deactivateAction"
                )}
              >
                <XCircle className="size-4" />
              </Button>
            }
          />
        </>
      ) : (
        <>
          <ConfirmDialog
            title={t(
              "benefits.rowActions.reactivateTitle"
            )}
            description={t(
              "benefits.rowActions.reactivateDescription"
            )}
            onConfirm={() =>
              handleReactivate()
            }
            actionLabel={t(
              "benefits.rowActions.reactivateAction"
            )}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!planIsActive}
                title={t(
                  "benefits.rowActions.reactivateAction"
                )}
                aria-label={t(
                  "benefits.rowActions.reactivateAction"
                )}
              >
                <RotateCcw className="size-4" />
              </Button>
            }
          />

          {canDeleteBenefitsPermanently ? (
            <ConfirmDialog
              title={t(
                "benefits.rowActions.deleteTitle"
              )}
              description={t(
                "benefits.rowActions.deleteDescription"
              )}
              onConfirm={() =>
                handleDelete()
              }
              actionLabel={t(
                "shared.actions.deletePermanently"
              )}
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
                  title={t(
                    "shared.actions.deletePermanently"
                  )}
                  aria-label={t(
                    "shared.actions.deletePermanently"
                  )}
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}
