"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import { createPatient } from "../actions/create-patient";

import { updatePatient } from "../actions/update-patient";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";
import { formatDateForInput } from "@/features/shared/utils/format-date-for-input";

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

type Props = {
  mode?: "create" | "edit";

  initialData?: {
    id: string;

    fullName: string;

    email: string;

    phone: string;

    birthDate: Date;

    document: string;

    zipCode: string;

    city: string;

    state: string;

    address: string;
  };

  trigger?: React.ReactNode;
};

export function PatientDialog({
  mode = "create",
  initialData,
  trigger,
}: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const form = useForm<PatientSchema>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      birthDate: "",
      document: "",
      zipCode: "",
      city: "",
      state: "",
      address: "",
    },
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset({
        fullName: initialData.fullName,
        email: initialData.email,
        phone: initialData.phone,
        birthDate: formatDateForInput(
          initialData.birthDate
        ),
        document: initialData.document,
        zipCode: initialData.zipCode,
        city: initialData.city,
        state: initialData.state,
        address: initialData.address,
      });

      return;
    }

    form.reset({
      fullName: "",
      email: "",
      phone: "",
      birthDate: "",
      document: "",
      zipCode: "",
      city: "",
      state: "",
      address: "",
    });
  }, [form, initialData, mode]);

  async function onSubmit(
    values: PatientSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updatePatient(
          initialData.id,
          values
        );

        toast.success(
          t("patients.dialog.saveSuccess")
        );
      } else {
        await createPatient(values);

        toast.success(
          t("patients.dialog.createSuccess")
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        t("patients.dialog.saveError")
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>{t("patients.new")}</Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("patients.dialog.editTitle")
              : t("patients.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.fullName")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.fullName"
              )}
              {...form.register(
                "fullName"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.email")}
            </label>
            <Input
              placeholder={t("shared.labels.email")}
              {...form.register("email")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.phone")}
            </label>
            <Input
              placeholder={t("shared.labels.phone")}
              {...form.register("phone")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.birthDate")}
            </label>
            <Input
              type="date"
              {...form.register(
                "birthDate"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.document")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.document"
              )}
              {...form.register(
                "document"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.zipCode")}
            </label>
            <Input
              placeholder={t(
                "shared.labels.zipCode"
              )}
              {...form.register(
                "zipCode"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.city")}
            </label>
            <Input
              placeholder={t("shared.labels.city")}
              {...form.register("city")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.state")}
            </label>
            <Input
              placeholder={t("shared.labels.state")}
              {...form.register("state")}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("shared.labels.address")}
            </label>
            <Input
              placeholder={t("shared.labels.address")}
              {...form.register(
                "address"
              )}
            />
          </div>

          <div className="col-span-2">
            <ConfirmDialog
              title={
                mode === "edit"
                  ? t(
                      "patients.dialog.confirmEditTitle"
                    )
                  : t(
                      "patients.dialog.confirmCreateTitle"
                    )
              }
              description={
                mode === "edit"
                  ? t(
                      "patients.dialog.confirmEditDescription"
                    )
                  : t(
                      "patients.dialog.confirmCreateDescription"
                    )
              }
              actionLabel={
                mode === "edit"
                  ? t("shared.actions.saveChanges")
                  : t("patients.dialog.createAction")
              }
              trigger={
                <Button
                  type="button"
                  className="w-full"
                >
                  {mode === "edit"
                    ? t("shared.actions.saveChanges")
                    : t("patients.dialog.createAction")}
                </Button>
              }
              onConfirm={() =>
                void form.handleSubmit(
                  onSubmit
                )()
              }
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
