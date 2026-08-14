"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { AuditAction, AuditEntity } from "@prisma/client";

import prisma from "@/lib/prisma";
import { assertClinicAccess } from "@/lib/auth/assert-clinic-access";
import { safeRevalidatePath } from "@/lib/revalidation";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { getClinicMasterUser } from "@/features/auth/services/clinic-master";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";
import {
  normalizeClinicState,
  normalizeDigits,
} from "../services/clinic-formats";
import { buildUniqueClinicSlug } from "../services/build-clinic-slug";

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
    throw new Error(
      "Revise os dados da clínica antes de continuar."
    );
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
    throw new Error(
      "Clinica nao encontrada."
    );
  }

  await assertClinicAccess({
    clinicId: clinic.id,
  });

  const actor =
    await getCurrentAuditActor();
  const normalizedEmail =
    parsed.data.email.toLowerCase();
  const slug =
    await buildUniqueClinicSlug(
      parsed.data.slug?.trim()
        ? parsed.data.slug
        : parsed.data.name,
      {
        excludeClinicId: clinic.id,
      }
    );

  await prisma.$transaction(
    async (tx) => {
      const clinicMaster =
        await getClinicMasterUser(
          clinic.id,
          tx
        );

      if (
        clinicMaster &&
        clinicMaster.email !==
          normalizedEmail
      ) {
        const conflictingUser =
          await tx.appUser.findUnique({
            where: {
              email: normalizedEmail,
            },
            select: {
              id: true,
            },
          });

        if (
          conflictingUser &&
          conflictingUser.id !==
            clinicMaster.id
        ) {
          throw new Error(
            "Ja existe um usuario com o e-mail informado para a clinica."
          );
        }
      }

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
            logoUrl:
              parsed.data.logoUrl || null,
            slug,
            document:
              parsed.data.document,
            email: normalizedEmail,
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

      if (clinicMaster) {
        await tx.appUser.update({
          where: {
            id: clinicMaster.id,
          },
          data: {
            email: normalizedEmail,
            name:
              parsed.data.brandName ||
              parsed.data.name,
          },
        });
      }

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

  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/dashboard/clinics");
  safeRevalidatePath("/dashboard/empresas");
  safeRevalidatePath(
    `/dashboard/empresas/${id}`
  );
}
