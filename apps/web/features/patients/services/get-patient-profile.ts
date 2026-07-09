import {
  AuditLog,
  AuditEntity,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/features/audit-log/services/get-audit-logs";

function isObjectRecord(
  value: Prisma.JsonValue | null | undefined
): value is Prisma.JsonObject {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function matchesMetadataId(
  metadata: Prisma.JsonValue | null,
  key: string,
  ids: string[]
) {
  if (!isObjectRecord(metadata)) {
    return false;
  }

  const candidate = metadata[key];
  return (
    typeof candidate === "string" &&
    ids.includes(candidate)
  );
}

function buildTimelineEntry(log: AuditLog) {
  return {
    id: log.id,
    occurredAt: log.createdAt,
    title: `${AUDIT_ACTION_LABELS[log.action] ?? log.action} ${AUDIT_ENTITY_LABELS[log.entity] ?? log.entity}`,
    actor: log.actor,
    entity: log.entity,
    action: log.action,
    entityId: log.entityId,
    entityLabel: log.entityLabel,
    metadata: log.metadata,
  };
}

export async function getPatientProfile(
  patientId: string
) {
  const clinicId =
    await getCurrentClinicId();

  const patient =
    await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
      },
      include: {
        responsiblePatient: {
          include: {
            subscriptions: {
              include: {
                membershipPlan: true,
                benefitUsages: {
                  include: {
                    membershipBenefit: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                  orderBy: {
                    usedAt: "desc",
                  },
                },
              },
              orderBy: {
                startedAt: "desc",
              },
            },
            invoices: {
              include: {
                subscription: {
                  select: {
                    id: true,
                    status: true,
                    membershipPlan: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                payments: {
                  orderBy: {
                    paidAt: "desc",
                  },
                },
              },
              orderBy: {
                dueDate: "desc",
              },
            },
          },
        },
        subscriptions: {
          include: {
            membershipPlan: true,
            benefitUsages: {
              include: {
                membershipBenefit: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
              orderBy: {
                usedAt: "desc",
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
        },
        invoices: {
          include: {
            subscription: {
              select: {
                id: true,
                status: true,
                membershipPlan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            payments: {
              orderBy: {
                paidAt: "desc",
              },
            },
          },
          orderBy: {
            dueDate: "desc",
          },
        },
        patientContracts: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            template: {
              select: {
                id: true,
                title: true,
              },
            },
            acceptances: {
              orderBy: {
                acceptedAt: "desc",
              },
            },
          },
        },
      },
    });

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const subscriptionSourcePatient =
    patient.kind === "DEPENDENT" &&
    patient.responsiblePatient
      ? patient.responsiblePatient
      : patient;

  const visibleSubscriptions =
    subscriptionSourcePatient.subscriptions;
  const visibleInvoices =
    subscriptionSourcePatient.invoices;

  const subscriptionIds =
    visibleSubscriptions.map(
      (subscription) => subscription.id
    );
  const invoiceIds =
    visibleInvoices.map(
      (invoice) => invoice.id
    );
  const usageIds =
    visibleSubscriptions.flatMap(
      (subscription) =>
        subscription.benefitUsages.map(
          (usage) => usage.id
        )
    );
  const contractIds =
    patient.patientContracts.map(
      (contract) => contract.id
    );

  const candidateLogs =
    await prisma.auditLog.findMany({
      where: {
        clinicId,
        entity: {
          in: [
            AuditEntity.PATIENT,
            AuditEntity.SUBSCRIPTION,
            AuditEntity.BENEFIT_USAGE,
            AuditEntity.PATIENT_INVOICE,
            AuditEntity.PATIENT_PAYMENT,
            AuditEntity.PATIENT_CONTRACT,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });

  const auditLogs =
    candidateLogs.filter((log) => {
      if (
        log.entity === AuditEntity.PATIENT &&
        log.entityId === patient.id
      ) {
        return true;
      }

      if (
        log.entity === AuditEntity.SUBSCRIPTION &&
        subscriptionIds.includes(log.entityId)
      ) {
        return true;
      }

      if (
        log.entity === AuditEntity.BENEFIT_USAGE &&
        usageIds.includes(log.entityId)
      ) {
        return true;
      }

      if (
        log.entity === AuditEntity.PATIENT_INVOICE &&
        invoiceIds.includes(log.entityId)
      ) {
        return true;
      }

      if (
        log.entity === AuditEntity.PATIENT_CONTRACT &&
        contractIds.includes(log.entityId)
      ) {
        return true;
      }

      return (
        matchesMetadataId(
          log.metadata,
          "patientId",
          [
            patient.id,
            subscriptionSourcePatient.id,
          ]
        ) ||
        matchesMetadataId(
          log.metadata,
          "subscriptionId",
          subscriptionIds
        ) ||
        matchesMetadataId(
          log.metadata,
          "invoiceId",
          invoiceIds
        ) ||
        matchesMetadataId(
          log.metadata,
          "patientInvoiceId",
          invoiceIds
        )
      );
    });

  return {
    patient,
    subscriptionSourcePatient: {
      id: subscriptionSourcePatient.id,
      fullName:
        subscriptionSourcePatient.fullName,
    },
    visibleSubscriptions,
    visibleInvoices,
    auditLogs,
    timeline: auditLogs
      .map(buildTimelineEntry)
      .sort(
        (left, right) =>
          right.occurredAt.getTime() -
          left.occurredAt.getTime()
      ),
  };
}
