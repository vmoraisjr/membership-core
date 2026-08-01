import { NextRequest, NextResponse } from "next/server";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  getAuditLogs,
} from "@/features/audit-log/services/get-audit-logs";

function escapeCsvValue(
  value: string | null | undefined
) {
  const normalized = value ?? "";
  return `"${normalized.replace(/"/g, '""')}"`;
}

function formatMetadata(
  metadata: unknown
) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  if (Array.isArray(metadata)) {
    return metadata.join(", ");
  }

  return Object.entries(
    metadata as Record<string, unknown>
  )
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export async function GET(
  request: NextRequest
) {
  const searchParams =
    request.nextUrl.searchParams;
  const { logs, isPlatformView } =
    await getAuditLogs({
      actor:
        searchParams.get("actor") ??
        undefined,
      entity:
        searchParams.get("entity") ??
        undefined,
      date:
        searchParams.get("date") ??
        undefined,
      clinicId:
        searchParams.get("clinicId") ??
        undefined,
    });

  const rows = [
    [
      "quando",
      "clinica",
      "usuario",
      "acao",
      "entidade",
      "registro",
      "detalhes",
    ],
    ...logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      isPlatformView
        ? log.clinic?.brandName ??
          log.clinic?.name ??
          "Plataforma"
        : "",
      log.actor,
      AUDIT_ACTION_LABELS[log.action] ??
        log.action,
      AUDIT_ENTITY_LABELS[log.entity] ??
        log.entity,
      log.entityLabel ?? log.entityId,
      formatMetadata(log.metadata),
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) =>
          escapeCsvValue(value)
        )
        .join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type":
        "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="auditoria.csv"',
    },
  });
}
