import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  getAuditLogs,
} from "@/features/audit-log/services/get-audit-logs";

export async function getRecentActivity(limit = 5) {
  const { logs } = await getAuditLogs();

  return logs.slice(0, limit).map((log) => ({
    id: log.id,
    actor: log.actor,
    actionLabel:
      AUDIT_ACTION_LABELS[log.action] ?? log.action,
    entityLabel:
      log.entityLabel ??
      AUDIT_ENTITY_LABELS[log.entity] ??
      log.entity,
    createdAt: log.createdAt,
  }));
}
