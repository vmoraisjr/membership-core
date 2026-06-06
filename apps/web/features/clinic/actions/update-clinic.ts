"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/auth/assert-clinic-access";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

export async function updateClinic(
  id: string,
  data: ClinicSchema
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const parsed =
    clinicSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

  if (!clinic) {
    throw new Error("Clinic not found.");
  }

  await assertClinicAccess({
    clinicId: clinic.id,
  });

  const slug =
    parsed.data.slug.toLowerCase();
  const actor =
    await getCurrentAuditActor();

  const conflictingClinic =
    await prisma.clinic.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

  if (
    conflictingClinic &&
    conflictingClinic.id !== clinic.id
  ) {
    throw new Error(
      "A clinic with this slug already exists."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const updatedClinic =
        await tx.clinic.update({
          where: {
            id: clinic.id,
          },
          data: {
            name: parsed.data.name,
            brandName:
              parsed.data.brandName ||
              null,
            slug,
            document:
              parsed.data.document,
            email: parsed.data.email,
            phone: parsed.data.phone,
            zipCode:
              parsed.data.zipCode,
            city: parsed.data.city,
            state: parsed.data.state,
            address:
              parsed.data.address,
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });

      await createAuditLog(tx, {
        clinicId: updatedClinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.CLINIC,
        entityId: updatedClinic.id,
        entityLabel:
          updatedClinic.name,
        metadata: {
          slug: updatedClinic.slug,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clinics");
}
