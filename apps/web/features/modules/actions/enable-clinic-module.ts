"use server";
import {
  AuditAction,
  AuditEntity,
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { ensureClinicModules } from "../services/module-access";
import { isModuleV1Active } from "../services/module-policy";

export async function enableClinicModuleAction(
  formData: FormData
) {
  await assertPermission(
    "modules",
    "manage"
  );

  const moduleKey = String(
    formData.get("moduleKey") ?? ""
  ) as ModuleKey;
  const clinicId =
    await getCurrentClinicId();
  const actor =
    await getCurrentAuditActor();

  const clinicModules =
    await ensureClinicModules(clinicId);
  const clinicModule =
    clinicModules.find(
      (entry) =>
        entry.module.key === moduleKey
    );

  if (!clinicModule) {
    throw new Error(
      "Clinic module not found."
    );
  }

  if (
    !isModuleV1Active(moduleKey)
  ) {
    throw new Error(
      "This module cannot be enabled in V1."
    );
  }

  if (
    clinicModule.status ===
    ModuleStatus.ENABLED
  ) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.clinicModule.update({
        where: {
          id: clinicModule.id,
        },
        data: {
          status:
            ModuleStatus.ENABLED,
          enabledAt: new Date(),
          disabledAt: null,
        },
      });

      await createAuditLog(tx, {
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.ENABLE_MODULE,
        entity:
          AuditEntity.CLINIC_MODULE,
        entityId: clinicModule.id,
        entityLabel:
          clinicModule.module.name,
        metadata: {
          moduleKey,
          nextStatus:
            ModuleStatus.ENABLED,
        },
      });
    }
  );

  safeRevalidatePath(
    "/dashboard/modules"
  );
  safeRevalidatePath("/dashboard");
}
