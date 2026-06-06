import {
  AuditAction,
  AuditEntity,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  filterByClinic,
  getCurrentClinicContext,
} from "@/lib/auth/tenant";

export type AuditLogFilters = {
  actor?: string;
  entity?: string;
  date?: string;
};

function isAuditEntity(
  value: string
): value is AuditEntity {
  return Object.values(AuditEntity).includes(
    value as AuditEntity
  );
}

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export const AUDIT_ACTION_LABELS: Record<
  AuditAction,
  string
> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  DEACTIVATE: "Deactivate",
  REACTIVATE: "Reactivate",
  CONSUME_BENEFIT: "Consume Benefit",
  CANCEL_SUBSCRIPTION:
    "Cancel Subscription",
  RENEW_SUBSCRIPTION:
    "Renew Subscription",
  PAUSE_SUBSCRIPTION:
    "Pause Subscription",
  RESUME_SUBSCRIPTION:
    "Resume Subscription",
  EXPIRE_SUBSCRIPTION:
    "Expire Subscription",
  MARK_INVOICE_PAID:
    "Mark Invoice Paid",
  MARK_INVOICE_OVERDUE:
    "Mark Invoice Overdue",
  ACCEPT_CONTRACT:
    "Accept Contract",
  ENABLE_MODULE: "Enable Module",
  DISABLE_MODULE:
    "Disable Module",
};

export const AUDIT_ENTITY_LABELS: Record<
  AuditEntity,
  string
> = {
  CLINIC: "Clinic",
  PATIENT: "Patient",
  LEAD: "Lead",
  MEMBERSHIP_PLAN:
    "Membership Plan",
  MEMBERSHIP_BENEFIT:
    "Membership Benefit",
  SUBSCRIPTION: "Subscription",
  BENEFIT_USAGE: "Benefit Usage",
  PATIENT_INVOICE:
    "Patient Invoice",
  PATIENT_PAYMENT:
    "Patient Payment",
  CLINIC_BILLING_PLAN:
    "Clinic Billing Plan",
  CLINIC_SUBSCRIPTION:
    "Clinic Subscription",
  CLINIC_INVOICE:
    "Clinic Invoice",
  CLINIC_PAYMENT:
    "Clinic Payment",
  MODULE: "Module",
  CLINIC_MODULE:
    "Clinic Module",
  CONTRACT_TEMPLATE:
    "Contract Template",
  PATIENT_CONTRACT:
    "Patient Contract",
  CLINIC_CONTRACT:
    "Clinic Contract",
};

export async function getAuditLogs(
  filters: AuditLogFilters = {}
) {
  const { clinicId } =
    await getCurrentClinicContext();
  const where: Prisma.AuditLogWhereInput =
    filterByClinic(clinicId);

  const actor = filters.actor?.trim();
  if (actor) {
    where.actor = actor;
  }

  const entity = filters.entity?.trim();
  if (entity && isAuditEntity(entity)) {
    where.entity = entity;
  }

  if (filters.date) {
    const range = getDateRange(
      filters.date
    );

    if (range) {
      where.createdAt = {
        gte: range.start,
        lt: range.end,
      };
    }
  }

  const [logs, actors, entities] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
      prisma.auditLog.findMany({
        where: {
          clinicId,
        },
        distinct: ["actor"],
        orderBy: {
          actor: "asc",
        },
        select: {
          actor: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          clinicId,
        },
        distinct: ["entity"],
        orderBy: {
          entity: "asc",
        },
        select: {
          entity: true,
        },
      }),
    ]);

  return {
    logs,
    actorOptions: actors.map(
      ({ actor: currentActor }) =>
        currentActor
    ),
    entityOptions: entities.map(
      ({ entity: currentEntity }) =>
        currentEntity
    ),
  };
}
