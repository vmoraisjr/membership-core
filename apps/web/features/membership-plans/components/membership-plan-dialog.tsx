"use client";

import { PencilLine } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

import { createMembershipPlan } from "../actions/create-membership-plan";

import { updateMembershipPlan } from "../actions/update-membership-plan";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/provider";

import { Textarea } from "@/components/ui/textarea";

import type {
  Prisma,
} from "@prisma/client";


type Props = {
  mode?: "create" | "edit";

  initialData?: {
    id: string;

    name: string;

    description: string | null;

    monthlyPrice: Prisma.Decimal | number;
  };

  trigger?: React.ReactNode;
};

export function MembershipPlanDialog({
  mode = "create",

  initialData,

  trigger,
}: Props) {
  const t = useTranslations();
  const [open, setOpen] =
    useState(false);
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");

  const form =
    useForm<MembershipPlanSchema>({
      resolver: zodResolver(
        membershipPlanSchema
      ),

      defaultValues: {
        name: "",

        description: "",

        monthlyPrice: 0,
      },
    });

  const getDefaultValues =
    useCallback(() => {
      return {
        name: "",
        description: "",
        monthlyPrice: 0,
      };
    }, []);

  const getInitialFormValues =
    useCallback(() => {
      if (
        mode === "edit" &&
        initialData
      ) {
        return {
          name: initialData.name,
          description:
            initialData.description ?? "",
          monthlyPrice: Number(
            initialData.monthlyPrice
          ),
        };
      }

      return getDefaultValues();
    }, [
      getDefaultValues,
      initialData,
      mode,
    ]);

  useEffect(() => {
    form.reset(getInitialFormValues());
  }, [
    form,
    getInitialFormValues,
    initialData,
    mode,
  ]);

  async function onSubmit(
    values: MembershipPlanSchema
  ) {
    try {
      if (
        mode === "edit" &&
        initialData
      ) {
        await updateMembershipPlan(
          initialData.id,
          values
        );

        toast.success(
          t("plans.dialog.saveSuccess")
        );
      } else {
        await createMembershipPlan(
          values
        );

        toast.success(
          t("plans.dialog.createSuccess")
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        t("plans.dialog.saveError")
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setEditingEnabled(
            mode === "create"
          );
          form.reset(
            getInitialFormValues()
          );
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {t("plans.new")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("plans.dialog.editTitle")
              : t("plans.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("plans.dialog.name")}
            </label>
            <Input
              placeholder={t("plans.dialog.name")}
              disabled={!editingEnabled}
              {...form.register("name")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.description")}
            </label>
            <Textarea
              placeholder={t(
                "shared.labels.description"
              )}
              disabled={!editingEnabled}
              {...form.register(
                "description"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("plans.dialog.monthlyPrice")}
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={t(
                "plans.dialog.monthlyPrice"
              )}
              disabled={!editingEnabled}
              {...form.register(
                "monthlyPrice",
                {
                  valueAsNumber: true,
                }
              )}
            />
          </div>

          {mode === "edit" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {!editingEnabled ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setEditingEnabled(true)
                  }
                >
                  <PencilLine className="mr-2 size-4" />
                  Habilitar edição
                </Button>
              ) : (
                <>
                  <ConfirmDialog
                    title={t("plans.dialog.confirmEditTitle")}
                    description={t(
                      "plans.dialog.confirmEditDescription"
                    )}
                    actionLabel={t("shared.actions.saveChanges")}
                    trigger={
                      <Button
                        type="button"
                        className="w-full"
                      >
                        {t("shared.actions.saveChanges")}
                      </Button>
                    }
                    onConfirm={() =>
                      void form.handleSubmit(
                        onSubmit
                      )()
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingEnabled(
                        false
                      );
                      form.reset(
                        getInitialFormValues()
                      );
                    }}
                  >
                    Cancelar edição
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ConfirmDialog
              title={t(
                "plans.dialog.confirmCreateTitle"
              )}
              description={t(
                "plans.dialog.confirmCreateDescription"
              )}
              actionLabel={t("plans.dialog.createAction")}
              trigger={
                <Button type="button">
                  {t("plans.dialog.createAction")}
                </Button>
              }
              onConfirm={() =>
                void form.handleSubmit(
                  onSubmit
                )()
              }
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
