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
          "Patient updated."
        );
      } else {
        await createPatient(values);

        toast.success(
          "Patient created."
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to save patient."
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
          <Button>New Patient</Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Patient"
              : "Create Patient"}
          </DialogTitle>
        </DialogHeader>

        <form className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Full name
            </label>
            <Input
              placeholder="Full name"
              {...form.register(
                "fullName"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              placeholder="Email"
              {...form.register("email")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Phone
            </label>
            <Input
              placeholder="Phone"
              {...form.register("phone")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Birth date
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
              Document
            </label>
            <Input
              placeholder="Document"
              {...form.register(
                "document"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              ZIP code
            </label>
            <Input
              placeholder="ZIP code"
              {...form.register(
                "zipCode"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              City
            </label>
            <Input
              placeholder="City"
              {...form.register("city")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              State
            </label>
            <Input
              placeholder="State"
              {...form.register("state")}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm text-muted-foreground">
              Address
            </label>
            <Input
              placeholder="Address"
              {...form.register(
                "address"
              )}
            />
          </div>

          <div className="col-span-2">
            <ConfirmDialog
              title={
                mode === "edit"
                  ? "Save patient changes?"
                  : "Create patient?"
              }
              description={
                mode === "edit"
                  ? "This updates the selected patient record."
                  : "This creates a new patient record."
              }
              actionLabel={
                mode === "edit"
                  ? "Save changes"
                  : "Create patient"
              }
              trigger={
                <Button
                  type="button"
                  className="w-full"
                >
                  {mode === "edit"
                    ? "Save Changes"
                    : "Create Patient"}
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
