"use server";
import {
  AuditAction,
  AuditEntity,
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidation";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { ensureClinicModules } from "../services/module-access";
import { isModuleV1Active } from "../services/module-policy";

function assertPlatformOwner(user: {
  clinicId: string | null;
  role: string;
}) {
  if (
    user.clinicId ||
    (user.role !== "OWNER" &&
      user.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas owner ou administrador da plataforma podem administrar os módulos das clínicas."
    );
  }
}

export async function platformSetClinicModuleStatusAction(
  formData: FormData
) {
  await assertPermission(
    "modules",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  assertPlatformOwner(currentUser);

  const clinicId = String(
    formData.get("clinicId") ?? ""
  );
  const moduleKey = String(
    formData.get("moduleKey") ?? ""
  ) as ModuleKey;
  const nextStatus = String(
    formData.get("nextStatus") ?? ""
  ) as ModuleStatus;

  if (!clinicId) {
    throw new Error(
      "Clinic id is required."
    );
  }

  if (
    nextStatus ===
      ModuleStatus.DISABLED &&
    moduleKey === ModuleKey.MEMBERSHIP
  ) {
    throw new Error(
      "The core Membership module cannot be disabled in V1."
    );
  }

  if (
    nextStatus ===
      ModuleStatus.ENABLED &&
    !isModuleV1Active(moduleKey)
  ) {
    throw new Error(
      "This module cannot be enabled in V1."
    );
  }

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
    clinicModule.status === nextStatus
  ) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.clinicModule.update({
        where: {
          id: clinicModule.id,
        },
        data:
          nextStatus ===
          ModuleStatus.ENABLED
            ? {
                status:
                  ModuleStatus.ENABLED,
                enabledAt: new Date(),
                disabledAt: null,
              }
            : {
                status:
                  ModuleStatus.DISABLED,
                disabledAt: new Date(),
              },
      });

      await createAuditLog(tx, {
        clinicId,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          nextStatus ===
          ModuleStatus.ENABLED
            ? AuditAction.ENABLE_MODULE
            : AuditAction.DISABLE_MODULE,
        entity:
          AuditEntity.CLINIC_MODULE,
        entityId: clinicModule.id,
        entityLabel:
          clinicModule.module.name,
        metadata: {
          moduleKey,
          nextStatus,
        },
      });
    }
  );

  safeRevalidatePath(
    `/dashboard/empresas/${clinicId}`
  );
}
