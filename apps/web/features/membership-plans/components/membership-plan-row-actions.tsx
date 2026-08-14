"use client";

import { useRef } from "react";

import {
  Copy,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { cloneMembershipPlan } from "../actions/clone-membership-plan";
import { deactivateMembershipPlan } from "../actions/deactivate-membership-plan";
import { reactivateMembershipPlan } from "../actions/reactivate-membership-plan";
import { deleteMembershipPlanPermanently } from "../actions/delete-membership-plan-permanently";
import { MembershipBenefitDialog } from "@/features/membership-benefits/components/membership-benefit-dialog";
import { useTranslations } from "@/i18n/provider";
import { planoUrl } from "@/lib/company-routes";

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

  const editTriggerRef =
    useRef<HTMLButtonElement>(null);
  const addBenefitTriggerRef =
    useRef<HTMLButtonElement>(null);
  const deactivateTriggerRef =
    useRef<HTMLButtonElement>(null);
  const reactivateTriggerRef =
    useRef<HTMLButtonElement>(null);
  const deleteTriggerRef =
    useRef<HTMLButtonElement>(null);

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
      size="sm"
      variant="outline"
      asChild
    >
      <Link href={planoUrl(plan.id)}>
        {t("plans.table.viewAction")}
      </Link>
    </Button>
  );

  if (!canManagePlans) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {viewButton}
        <span className="text-xs text-muted-foreground">
          {t("shared.states.readOnly")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {viewButton}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            title={t(
              "shared.labels.actions"
            )}
            aria-label={t(
              "shared.labels.actions"
            )}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {plan.active ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  editTriggerRef.current?.click()
                }
              >
                {t("shared.actions.edit")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() =>
                  void handleClone()
                }
              >
                <Copy className="size-4" />
                {t(
                  "plans.rowActions.clone"
                )}
              </DropdownMenuItem>

              {canManageBenefits ? (
                <DropdownMenuItem
                  onSelect={() =>
                    addBenefitTriggerRef.current?.click()
                  }
                >
                  <Plus className="size-4" />
                  {t(
                    "benefits.dialog.createTitle"
                  )}
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  deactivateTriggerRef.current?.click()
                }
              >
                <XCircle className="size-4" />
                {t(
                  "plans.rowActions.deactivateAction"
                )}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  reactivateTriggerRef.current?.click()
                }
              >
                <RotateCcw className="size-4" />
                {t(
                  "plans.rowActions.reactivateAction"
                )}
              </DropdownMenuItem>

              {canDeletePlansPermanently ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    deleteTriggerRef.current?.click()
                  }
                >
                  <Trash2 className="size-4" />
                  {t(
                    "shared.actions.deletePermanently"
                  )}
                </DropdownMenuItem>
              ) : null}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden triggers: same dialogs/confirmations as before, surfaced
          only through the "Ações" menu above (UI-063). */}
      <MembershipPlanDialog
        mode="edit"
        initialData={{
          id: plan.id,
          name: plan.name,
          description: plan.description,
          monthlyPrice: Number(
            plan.monthlyPrice
          ),
          annualPrice:
            plan.annualPrice ?? null,
          active: plan.active,
        }}
        trigger={
          <button
            ref={editTriggerRef}
            type="button"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        }
      />

      {canManageBenefits ? (
        <MembershipBenefitDialog
          plans={benefitPlans}
          defaultMembershipPlanId={
            plan.id
          }
          trigger={
            <button
              ref={addBenefitTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
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
          <button
            ref={deactivateTriggerRef}
            type="button"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        }
      />

      <ConfirmDialog
        title={t(
          "plans.rowActions.reactivateTitle"
        )}
        description={t(
          "plans.rowActions.reactivateDescription"
        )}
        onConfirm={() => handleReactivate()}
        actionLabel={t(
          "plans.rowActions.reactivateAction"
        )}
        trigger={
          <button
            ref={reactivateTriggerRef}
            type="button"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
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
          onConfirm={() => handleDelete()}
          actionLabel={t(
            "shared.actions.deletePermanently"
          )}
          trigger={
            <button
              ref={deleteTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          }
        />
      ) : null}
    </div>
  );
}
