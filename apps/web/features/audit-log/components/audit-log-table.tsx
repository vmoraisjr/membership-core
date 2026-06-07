import Link from "next/link";

import type {
  AuditEntity,
  Prisma,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { AuditLogFilters } from "../services/get-audit-logs";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "../services/get-audit-logs";
import { getTranslations } from "@/i18n/messages";

type AuditLogItem = {
  id: string;
  actor: string;
  action: keyof typeof AUDIT_ACTION_LABELS;
  entity: AuditEntity;
  entityId: string;
  entityLabel: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

type Props = {
  logs: AuditLogItem[];
  filters: AuditLogFilters;
  actorOptions: string[];
  entityOptions: AuditEntity[];
};

function formatMetadata(
  metadata: Prisma.JsonValue | null
) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  if (Array.isArray(metadata)) {
    return metadata.join(", ");
  }

  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return null;
  }

  return entries
    .slice(0, 3)
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) =>
          char.toUpperCase()
        );

      return `${label}: ${String(value)}`;
    })
    .join(" | ");
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

export function AuditLogTable({
  logs,
  filters,
  actorOptions,
  entityOptions,
}: Props) {
  const t = getTranslations();
  return (
    <DataTableContainer
      title={t("audit.tableTitle")}
      description={t("audit.tableDescription")}
    >
      <form
        method="get"
        className="grid gap-4 border-b p-6 lg:grid-cols-4"
      >
        <div className="grid gap-2">
          <label
            htmlFor="actor"
            className="text-sm text-muted-foreground"
          >
            {t("shared.labels.user")}
          </label>
          <select
            id="actor"
            name="actor"
            defaultValue={
              filters.actor ?? ""
            }
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="">
              {t("shared.filters.allUsers")}
            </option>
            {actorOptions.map((actor) => (
              <option
                key={actor}
                value={actor}
              >
                {actor}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="entity"
            className="text-sm text-muted-foreground"
          >
            {t("shared.labels.entity")}
          </label>
          <select
            id="entity"
            name="entity"
            defaultValue={
              filters.entity ?? ""
            }
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="">
              {t("shared.filters.allEntities")}
            </option>
            {entityOptions.map((entity) => (
              <option
                key={entity}
                value={entity}
              >
                {
                  AUDIT_ENTITY_LABELS[
                    entity
                  ]
                }
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="date"
            className="text-sm text-muted-foreground"
          >
            {t("shared.labels.date")}
          </label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={
              filters.date ?? ""
            }
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit">
            {t("shared.actions.applyFilters")}
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link href="/dashboard/audit-logs">
              {t("shared.actions.clear")}
            </Link>
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shared.labels.when")}</TableHead>
            <TableHead>{t("shared.labels.user")}</TableHead>
            <TableHead>{t("shared.labels.actions")}</TableHead>
            <TableHead>{t("shared.labels.entity")}</TableHead>
            <TableHead>{t("shared.labels.details")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {logs.map((log) => {
            const details =
              formatMetadata(
                log.metadata
              );

            return (
              <TableRow key={log.id}>
                <TableCell className="align-top text-sm">
                  {formatDate(
                    log.createdAt
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {log.actor}
                </TableCell>
                <TableCell className="align-top">
                  {
                    AUDIT_ACTION_LABELS[
                      log.action
                    ]
                  }
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {
                        AUDIT_ENTITY_LABELS[
                          log.entity
                        ]
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.entityLabel ??
                        log.entityId}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {details ??
                    t("shared.states.noExtraDetails")}
                </TableCell>
              </TableRow>
            );
          })}

          {logs.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="p-0"
              >
                <EmptyState
                  title={t("audit.emptyTitle")}
                  description={t(
                    "audit.emptyDescription"
                  )}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
