"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { formatDateForInput } from "@/features/shared/utils/format-date-for-input";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createLead } from "../actions/create-lead";
import { updateLead } from "../actions/update-lead";
import {
  leadPipelineStatuses,
  leadSchema,
  type LeadSchema,
} from "../schemas/lead.schema";

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
    status:
      | "NEW"
      | "CONTACTED"
      | "PROPOSAL"
      | "NEGOTIATION"
      | "WON"
      | "LOST";
  };
  trigger?: React.ReactNode;
};

const statusLabels: Record<
  (typeof leadPipelineStatuses)[number],
  string
> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function LeadDialog({
  mode = "create",
  initialData,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<LeadSchema>({
    resolver: zodResolver(leadSchema),
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
      status: "NEW",
      notes: "",
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
        status: initialData.status,
        notes: "",
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
      status: "NEW",
      notes: "",
    });
  }, [form, initialData, mode]);

  async function onSubmit(
    values: LeadSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updateLead(
          initialData.id,
          values
        );

        toast.success("Lead updated.");
      } else {
        await createLead(values);

        toast.success("Lead created.");
      }

      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save lead."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button>New Lead</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Lead"
              : "Create Lead"}
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
              Full name
            </label>
            <Input
              {...form.register(
                "fullName"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Stage
            </label>
            <select
              {...form.register("status")}
              className="h-10 rounded-md border px-3"
            >
              {leadPipelineStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabels[status]}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              {...form.register("email")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Phone
            </label>
            <Input
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
              {...form.register("city")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              State
            </label>
            <Input
              {...form.register("state")}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm text-muted-foreground">
              Address
            </label>
            <Input
              {...form.register(
                "address"
              )}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm text-muted-foreground">
              {mode === "edit"
                ? "New note"
                : "Lead note"}
            </label>
            <Textarea
              rows={4}
              placeholder="Context, next steps, objections, or follow-up details"
              {...form.register("notes")}
            />
          </div>

          <Button
            type="submit"
            className="col-span-2"
          >
            {mode === "edit"
              ? "Save Changes"
              : "Create Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
