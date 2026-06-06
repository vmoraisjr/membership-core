"use server";

import {
  AuditAction,
  AuditEntity,
  LeadActivityType,
  PatientStatus,
} from "@prisma/client";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { createLeadActivity } from "../services/create-lead-activity";

export async function convertLeadToPatient(
  id: string
) {
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
      clinicId: true,
      fullName: true,
      email: true,
      phone: true,
      birthDate: true,
      document: true,
      zipCode: true,
      city: true,
      state: true,
      address: true,
      convertedPatientId: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (lead.convertedPatientId) {
    throw new Error(
      "Lead has already been converted."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const patient =
        await tx.patient.create({
          data: {
            clinicId: lead.clinicId,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            birthDate: lead.birthDate,
            document: lead.document,
            zipCode: lead.zipCode,
            city: lead.city,
            state: lead.state,
            address: lead.address,
            status: PatientStatus.ACTIVE,
          },
          select: {
            id: true,
            fullName: true,
          },
        });

      await tx.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          status: "WON",
          convertedAt: new Date(),
          convertedPatientId: patient.id,
        },
      });

      await createLeadActivity(tx, {
        leadId: lead.id,
        type: LeadActivityType.CONVERTED,
        description: `Lead converted into patient ${patient.fullName}.`,
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.LEAD,
        entityId: lead.id,
        entityLabel: lead.fullName,
        metadata: {
          convertedPatientId:
            patient.id,
          status: "WON",
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.PATIENT,
        entityId: patient.id,
        entityLabel:
          patient.fullName,
        metadata: {
          sourceLeadId: lead.id,
        },
      });
    }
  );

  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/patients");
}
