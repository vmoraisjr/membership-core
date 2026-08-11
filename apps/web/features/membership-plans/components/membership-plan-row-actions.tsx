"use client";

import {
  Copy,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { cloneMembershipPlan } from "../actions/clone-membership-plan";
import { deactivateMembershipPlan } from "../actions/deactivate-membership-plan";
import { reactivateMembershipPlan } from "../actions/reactivate-membership-plan";
import { deleteMembershipPlanPermanently } from "../actions/delete-membership-plan-permanently";
import { MembershipBenefitDialog } from "@/features/membership-benefits/components/membership-benefit-dialog";
import { useTranslations } from "@/i18n/provider";

import { MembershipPlanDialog } from "./membership-plan-dialog";

type Props = {
  plan: {
    id: string;

    name: string;

    description: string | null;

    monthlyPrice: number;

    annualPrice?: number | null;

    active: boolean;
  };

  benefitPlans: Array<{
    id: string;
    name: string;
  }>;
  canManagePlans?: boolean;
  canDeletePlansPermanently?: boolean;
  canManageBenefits?: boolean;
};

export function MembershipPlanRowActions({
  plan,
  benefitPlans,
  canManagePlans = true,
  canDeletePlansPermanently = true,
  canManageBenefits = true,
}: Props) {
  const t = useTranslations();

  async function handleDeactivate({
    typedValue,
  }: {
    typedValue: string;
    detailsValue: string;
  }) {
    try {
      await deactivateMembershipPlan(
        plan.id,
        typedValue
      );

      toast.success(
        t(
          "plans.rowActions.deactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "plans.rowActions.deactivateError"
            )
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateMembershipPlan(
        plan.id
      );

      toast.success(
        t(
          "plans.rowActions.reactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "plans.rowActions.reactivateError"
            )
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteMembershipPlanPermanently(
        plan.id
      );

      toast.success(
        t("plans.rowActions.deleteSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "plans.rowActions.deleteError"
            )
      );
    }
  }

  async function handleClone() {
    try {
      await cloneMembershipPlan(plan.id);
      toast.success(
        t("plans.rowActions.cloneSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "plans.rowActions.cloneError"
            )
      );
    }
  }

  const viewButton = (
    <Button
      size="icon-sm"
      variant="ghost"
      asChild
      title={t("shared.actions.view")}
    >
      <Link
        href={`/dashboard/plans/${plan.id}`}
      >
        <Eye className="size-4" />
      </Link>
    </Button>
  );

  if (!canManagePlans) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {viewButton}
        <span className="text-xs text-muted-foreground">
          {t("shared.states.readOnly")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {viewButton}

      {plan.active ? (
        <>
          <MembershipPlanDialog
            mode="edit"
            initialData={{
              id: plan.id,
              name: plan.name,
              description:
                plan.description,
              monthlyPrice: Number(
                plan.monthlyPrice
              ),
              annualPrice:
                plan.annualPrice ?? null,
              active: plan.active,
            }}
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

          <Button
            size="icon-sm"
            variant="ghost"
            title={t(
              "plans.rowActions.clone"
            )}
            aria-label={t(
              "plans.rowActions.clone"
            )}
            onClick={() =>
              void handleClone()
            }
          >
            <Copy className="size-4" />
          </Button>

          {canManageBenefits ? (
            <MembershipBenefitDialog
              plans={benefitPlans}
              defaultMembershipPlanId={
                plan.id
              }
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={t(
                    "benefits.dialog.createTitle"
                  )}
                  aria-label={t(
                    "benefits.dialog.createTitle"
                  )}
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
          ) : null}

          <ConfirmDialog
            title={t(
              "plans.rowActions.deactivateTitle"
            )}
            description={t(
              "plans.rowActions.deactivateDescription"
            )}
            confirmValue={plan.name}
            confirmLabel={t(
              "plans.rowActions.confirmName"
            )}
            confirmPlaceholder={plan.name}
            actionLabel={t(
              "plans.rowActions.deactivateAction"
            )}
            onConfirm={handleDeactivate}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
                title={t(
                  "plans.rowActions.deactivateAction"
                )}
                aria-label={t(
                  "plans.rowActions.deactivateAction"
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
              "plans.rowActions.reactivateTitle"
            )}
            description={t(
              "plans.rowActions.reactivateDescription"
            )}
            onConfirm={() =>
              handleReactivate()
            }
            actionLabel={t(
              "plans.rowActions.reactivateAction"
            )}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                title={t(
                  "plans.rowActions.reactivateAction"
                )}
                aria-label={t(
                  "plans.rowActions.reactivateAction"
                )}
              >
                <RotateCcw className="size-4" />
              </Button>
            }
          />

          {canDeletePlansPermanently ? (
            <ConfirmDialog
              title={t(
                "plans.rowActions.deleteTitle"
              )}
              description={t(
                "plans.rowActions.deleteDescription"
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
