"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import type { Patient } from "@prisma/client";

import { toast } from "sonner";

import { createPatient } from "../actions/create-patient";

import { updatePatient } from "../actions/update-patient";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

import { Button } from "@/components/ui/button";

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
  const [open, setOpen] =
    useState(false);

  const form =
    useForm<PatientSchema>({
      resolver:
        zodResolver(patientSchema),

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
    if (
      mode === "edit" &&
      initialData
    ) {
      form.reset({
        fullName:
          initialData.fullName,

        email: initialData.email,

        phone: initialData.phone,

        birthDate:
          initialData.birthDate
            .toISOString()
            .split("T")[0],

        document:
          initialData.document,

        zipCode:
          initialData.zipCode,

        city: initialData.city,

        state: initialData.state,

        address:
          initialData.address,
      });
    }
  }, [
    form,
    initialData,
    mode,
  ]);

  async function onSubmit(
    values: PatientSchema
  ) {
    try {
      if (
        mode === "edit" &&
        initialData
      ) {
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
          <Button>
            New Patient
          </Button>
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

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="grid grid-cols-2 gap-4"
        >
          <Input
            placeholder="Full name"
            {...form.register(
              "fullName"
            )}
          />

          <Input
            placeholder="Email"
            {...form.register("email")}
          />

          <Input
            placeholder="Phone"
            {...form.register("phone")}
          />

          <Input
            type="date"
            {...form.register(
              "birthDate"
            )}
          />

          <Input
            placeholder="Document"
            {...form.register(
              "document"
            )}
          />

          <Input
            placeholder="ZIP code"
            {...form.register(
              "zipCode"
            )}
          />

          <Input
            placeholder="City"
            {...form.register("city")}
          />

          <Input
            placeholder="State"
            {...form.register("state")}
          />

          <Input
            placeholder="Address"
            className="col-span-2"
            {...form.register(
              "address"
            )}
          />

          <Button
            type="submit"
            className="col-span-2"
          >
            {mode === "edit"
              ? "Save Changes"
              : "Create Patient"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}