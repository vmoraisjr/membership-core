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

export async function updateLead(
  id: string,
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

  const existingLead =
    await prisma.lead.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

  if (!existingLead) {
    throw new Error("Lead not found.");
  }

  await prisma.$transaction(
    async (tx) => {
      const lead = await tx.lead.update({
        where: {
          id: existingLead.id,
        },
        data: {
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
        type: LeadActivityType.UPDATED,
        description: `Lead updated and moved to ${lead.status}.`,
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
            "Additional lead note added.",
        });
      }

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
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
