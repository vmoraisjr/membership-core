"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { ensureClinicBillingFoundation } from "@/features/billing/services/billing-foundation";
import { ensureClinicContractRecord } from "@/features/contracts/services/contracts-foundation";
import { ensureClinicModules } from "@/features/modules/services/module-access";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

export async function createClinic(
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

  const slug =
    parsed.data.slug.toLowerCase();
  const actor =
    await getCurrentAuditActor();
  const currentUser =
    await requireCurrentAppUser();

  if (currentUser.clinicId) {
    throw new Error(
      "Creating additional clinics is not available in the V1 tenant workspace."
    );
  }

  const existingClinic =
    await prisma.clinic.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

  if (existingClinic) {
    throw new Error(
      "A clinic with this slug already exists."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const clinic =
        await tx.clinic.create({
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

      await tx.appUser.update({
        where: {
          id: currentUser.id,
        },
        data: {
          clinicId: clinic.id,
        },
      });

      await ensureClinicModules(
        clinic.id,
        tx
      );
      await ensureClinicBillingFoundation(
        clinic.id,
        tx
      );
      await ensureClinicContractRecord(
        clinic.id,
        tx
      );

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.CLINIC,
        entityId: clinic.id,
        entityLabel: clinic.name,
        metadata: {
          slug: clinic.slug,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clinics");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/contracts");
  revalidatePath("/dashboard/modules");
}
