"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

import { createPatient } from "../actions/create-patient";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

export function CreatePatientDialog() {
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

  async function onSubmit(
    values: PatientSchema
  ) {
    try {
      await createPatient(values);

      toast.success(
        "Patient created successfully."
      );

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to create patient."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          New Patient
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Create Patient
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
            {...form.register("fullName")}
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
            {...form.register("birthDate")}
          />

          <Input
            placeholder="Document"
            {...form.register("document")}
          />

          <Input
            placeholder="ZIP code"
            {...form.register("zipCode")}
          />

          <Input
            placeholder="City"
            {...form.register("city")}
          />

          <Input
            placeholder="State"
            {...form.register("state")}
          />

          <div className="col-span-2">
            <Input
              placeholder="Address"
              {...form.register("address")}
            />
          </div>

          <div className="col-span-2">
            <Button
              type="submit"
              className="w-full"
            >
              Create Patient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}