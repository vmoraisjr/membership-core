"use server";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { getClinicMasterUser } from "@/features/auth/services/clinic-master";
import { clinicBrandingSchema } from "../schemas/clinic.schema";

function normalizeOptionalString(
  value: FormDataEntryValue | null
) {
  const normalized = String(
    value ?? ""
  ).trim();

  return normalized || null;
}

export async function updateClinicBrandingAction(
  formData: FormData
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const clinicId =
    await getCurrentClinicId();
  const actor =
    await getCurrentAuditActor();
  const brandName =
    normalizeOptionalString(
      formData.get("brandName")
    );
  const logoUrl =
    normalizeOptionalString(
      formData.get("logoUrl")
    );
  const parsed =
    clinicBrandingSchema.safeParse({
      brandName: brandName ?? "",
      logoUrl: logoUrl ?? "",
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        "Revise a identidade da empresa antes de salvar."
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const clinic =
        await tx.clinic.update({
          where: {
            id: clinicId,
          },
          data: {
            brandName:
              parsed.data.brandName || null,
            logoUrl:
              parsed.data.logoUrl || null,
          },
          select: {
            id: true,
            name: true,
            brandName: true,
          },
        });

      const clinicMaster =
        await getClinicMasterUser(
          clinicId,
          tx
        );

      if (clinicMaster) {
        await tx.appUser.update({
          where: {
            id: clinicMaster.id,
          },
          data: {
            name:
              clinic.brandName ??
              clinic.name,
          },
        });
      }

      await createAuditLog(tx, {
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.CLINIC,
        entityId: clinic.id,
        entityLabel:
          clinic.brandName ??
          clinic.name,
        metadata: {
          scope: "clinic-branding",
        },
      });
    }
  );

  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/company");
  safeRevalidatePath("/dashboard/clinics");
}
