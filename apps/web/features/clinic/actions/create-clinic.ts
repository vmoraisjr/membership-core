"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { createClinicMasterUser } from "@/features/auth/services/clinic-master";
import { ensureClinicBillingFoundation } from "@/features/billing/services/billing-foundation";
import { ensureClinicContractRecord } from "@/features/contracts/services/contracts-foundation";
import { ensureClinicModules } from "@/features/modules/services/module-access";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";
import {
  normalizeClinicState,
  normalizeDigits,
} from "../services/clinic-formats";
import { buildUniqueClinicSlug } from "../services/build-clinic-slug";

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
    throw new Error(
      "Revise os dados da clínica antes de continuar."
    );
  }

  const actor =
    await getCurrentAuditActor();
  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.role !== "OWNER" &&
    currentUser.role !== "ADMIN"
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem criar clinicas."
    );
  }

  if (currentUser.clinicId) {
    throw new Error(
      "Nao e possivel criar outra clinica dentro deste workspace na V1."
    );
  }

  const slug =
    await buildUniqueClinicSlug(
      parsed.data.slug?.trim()
        ? parsed.data.slug
        : parsed.data.name
    );

  const result =
    await prisma.$transaction(
    async (tx) => {
      const clinic =
        await tx.clinic.create({
          data: {
            name: parsed.data.name,
            brandName:
              parsed.data.brandName ||
              null,
            logoUrl:
              parsed.data.logoUrl || null,
            slug,
            document:
              parsed.data.document,
            email:
              parsed.data.email.toLowerCase(),
            phone: normalizeDigits(
              parsed.data.phone
            ),
            zipCode:
              normalizeDigits(
                parsed.data.zipCode
              ),
            city: parsed.data.city,
            state:
              normalizeClinicState(
                parsed.data.state
              ),
            address:
              parsed.data.address,
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });
      const clinicMaster =
        await createClinicMasterUser(
          {
            clinicId: clinic.id,
            clinicName:
              parsed.data.brandName ||
              parsed.data.name,
            email: parsed.data.email,
            actorDisplayName:
              actor.displayName,
            actorUserId: actor.id,
          },
          tx
        );

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

      return {
        clinic,
        clinicMaster,
      };
    }
  );

  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/clinics");
  safeRevalidatePath("/dashboard/billing");
  safeRevalidatePath("/dashboard/contracts");
  safeRevalidatePath("/dashboard/modules");

  return {
    clinicId: result.clinic.id,
    clinicName: result.clinic.name,
    clinicMasterEmail:
      result.clinicMaster
        .clinicMaster.email,
    clinicMasterTemporaryPassword:
      result.clinicMaster
        .temporaryPassword,
  };
}
