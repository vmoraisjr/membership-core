"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { createClinic } from "../actions/create-clinic";
import { updateClinic } from "../actions/update-clinic";
import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

type Props = {
  mode?: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    brandName: string | null;
    slug: string;
    document: string;
    email: string;
    phone: string;
    zipCode: string;
    city: string;
    state: string;
    address: string;
  };
  trigger?: React.ReactNode;
};

const EMPTY_VALUES: ClinicSchema = {
  name: "",
  brandName: "",
  slug: "",
  document: "",
  email: "",
  phone: "",
  zipCode: "",
  city: "",
  state: "",
  address: "",
};

export function ClinicDialog({
  mode = "create",
  initialData,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<ClinicSchema>({
    resolver: zodResolver(clinicSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset({
        name: initialData.name,
        brandName:
          initialData.brandName ?? "",
        slug: initialData.slug,
        document: initialData.document,
        email: initialData.email,
        phone: initialData.phone,
        zipCode: initialData.zipCode,
        city: initialData.city,
        state: initialData.state,
        address: initialData.address,
      });

      return;
    }

    form.reset(EMPTY_VALUES);
  }, [form, initialData, mode]);

  async function onSubmit(
    values: ClinicSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updateClinic(
          initialData.id,
          values
        );

        toast.success(
          "Clinic updated."
        );
      } else {
        await createClinic(values);

        toast.success(
          "Clinic created."
        );
      }

      form.reset(EMPTY_VALUES);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save clinic."
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
          <Button>New Clinic</Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Clinic"
              : "Create Clinic"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="grid grid-cols-2 gap-4"
        >
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Clinic name
            </label>
            <Input
              placeholder="Clinic name"
              {...form.register("name")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Brand name
            </label>
            <Input
              placeholder="Brand name"
              {...form.register(
                "brandName"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Slug
            </label>
            <Input
              placeholder="clinic-slug"
              {...form.register("slug")}
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

          <Button
            type="submit"
            className="col-span-2"
          >
            {mode === "edit"
              ? "Save Changes"
              : "Create Clinic"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
