"use server";

import { AuditAction, AuditEntity, LeadActivityType } from "@prisma/client";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { createLeadActivity } from "../services/create-lead-activity";
import {
  leadSchema,
  type LeadSchema,
} from "../schemas/lead.schema";

export async function createLead(
  data: LeadSchema
) {
  await assertPermission(
    "crm",
    "manage"
  );

  const parsed = leadSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid lead data.");
  }

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  await prisma.$transaction(
    async (tx) => {
      const lead = await tx.lead.create({
        data: {
          clinicId: clinic.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          birthDate: new Date(
            parsed.data.birthDate
          ),
          document: parsed.data.document,
          zipCode: parsed.data.zipCode,
          city: parsed.data.city,
          state: parsed.data.state,
          address: parsed.data.address,
          status: parsed.data.status,
        },
        select: {
          id: true,
          fullName: true,
          status: true,
        },
      });

      await createLeadActivity(tx, {
        leadId: lead.id,
        type: LeadActivityType.CREATED,
        description: `Lead created in stage ${lead.status}.`,
      });

      const noteContent =
        parsed.data.notes?.trim();

      if (noteContent) {
        await tx.leadNote.create({
          data: {
            leadId: lead.id,
            content: noteContent,
          },
        });

        await createLeadActivity(tx, {
          leadId: lead.id,
          type: LeadActivityType.NOTE_ADDED,
          description:
            "Initial lead note added.",
        });
      }

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.LEAD,
        entityId: lead.id,
        entityLabel: lead.fullName,
        metadata: {
          status: lead.status,
        },
      });
    }
  );

  revalidatePath("/dashboard/crm");
}
