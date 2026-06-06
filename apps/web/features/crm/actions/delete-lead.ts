"use server";

import { AuditAction, AuditEntity } from "@prisma/client";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

export async function deleteLead(id: string) {
  await assertPermission(
    "crm",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      clinicId: clinic.id,
    },
    select: {
      id: true,
      fullName: true,
      convertedPatientId: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (lead.convertedPatientId) {
    throw new Error(
      "Converted leads cannot be deleted because the lifecycle must be preserved."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.DELETE,
        entity: AuditEntity.LEAD,
        entityId: lead.id,
        entityLabel: lead.fullName,
      });

      await tx.lead.delete({
        where: {
          id: lead.id,
        },
      });
    }
  );

  revalidatePath("/dashboard/crm");
}
