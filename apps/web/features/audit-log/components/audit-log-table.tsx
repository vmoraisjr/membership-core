import Link from "next/link";

import type {
  AuditAction,
  AuditEntity,
  Prisma,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
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

import type {
  AuditLogFilters,
  AuditLogPageSize,
} from "../services/get-audit-logs";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_LOG_PAGE_SIZE_OPTIONS,
} from "../services/get-audit-logs";
import { humanizeAuditMetadata } from "../utils/humanize-metadata";
import { getTranslations } from "@/i18n/messages";
import { AuditLogDetailsSidePanel } from "./audit-log-details-side-panel";

type AuditLogItem = {
  id: string;
  actor: string;
  action: keyof typeof AUDIT_ACTION_LABELS;
  entity: AuditEntity;
  entityId: string;
  entityLabel: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  clinic?: {
    id: string;
    name: string;
    brandName: string | null;
  } | null;
};

type Props = {
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageSize: AuditLogPageSize;
  filters: AuditLogFilters;
  actorOptions: string[];
  entityOptions: AuditEntity[];
  actionOptions: AuditAction[];
  clinicOptions: Array<{
    id: string;
    name: string;
  }>;
  isPlatformView: boolean;
  basePath?: string;
  extraParams?: Record<string, string>;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(
    "pt-BR"
  );
}

function buildExportHref(
  filters: AuditLogFilters
) {
  const searchParams =
    new URLSearchParams();

  if (filters.actor) {
    searchParams.set(
      "actor",
      filters.actor
    );
  }

  if (filters.entity) {
    searchParams.set(
      "entity",
      filters.entity
    );
  }

  if (filters.action) {
    searchParams.set(
      "action",
      filters.action
    );
  }

  if (filters.date) {
    searchParams.set(
      "date",
      filters.date
    );
  }

  if (filters.clinicId) {
    searchParams.set(
      "clinicId",
      filters.clinicId
    );
  }

  const query = searchParams.toString();

  return query.length > 0
    ? `/dashboard/audit-logs/export?${query}`
    : "/dashboard/audit-logs/export";
}

function buildPageHref(
  filters: AuditLogFilters,
  page: number,
  basePath: string,
  extraParams: Record<string, string>
) {
  const searchParams =
    new URLSearchParams();

  for (const [key, value] of Object.entries(
    extraParams
  )) {
    searchParams.set(key, value);
  }

  if (filters.actor) {
    searchParams.set("actor", filters.actor);
  }

  if (filters.entity) {
    searchParams.set(
      "entity",
      filters.entity
    );
  }

  if (filters.action) {
    searchParams.set(
      "action",
      filters.action
    );
  }

  if (filters.date) {
    searchParams.set("date", filters.date);
  }

  if (filters.clinicId) {
    searchParams.set(
      "clinicId",
      filters.clinicId
    );
  }

  if (filters.pageSize) {
    searchParams.set(
      "pageSize",
      String(filters.pageSize)
    );
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();

  return query.length > 0
    ? `${basePath}?${query}`
    : basePath;
}

function SummaryPreview({
  metadata,
}: {
  metadata: Prisma.JsonValue | null;
}) {
  const t = getTranslations();
  const { changes, fields } =
    humanizeAuditMetadata(metadata);

  if (
    changes.length === 0 &&
    fields.length === 0
  ) {
    return (
      <p>
        {t(
          "shared.states.noExtraDetails"
        )}
      </p>
    );
  }

  const changePreview = changes
    .slice(0, 2)
    .map(
      (change) =>
        `${change.label}: ${change.before} → ${change.after}`
    );
  const fieldPreview = fields
    .slice(
      0,
      Math.max(
        0,
        2 - changePreview.length
      )
    )
    .map(
      (field) =>
        `${field.label}: ${field.value}`
    );

  return (
    <p>
      {[...changePreview, ...fieldPreview].join(
        " · "
      )}
    </p>
  );
}

export function AuditLogTable({
  logs,
  total,
  page,
  pageSize,
  filters,
  actorOptions,
  entityOptions,
  actionOptions,
  clinicOptions,
  isPlatformView,
  basePath = "/dashboard/audit-logs",
  extraParams = {},
}: Props) {
  const t = getTranslations();
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(
          1,
          Math.ceil(total / pageSize)
        );
  const rangeStart =
    total === 0
      ? 0
      : pageSize === "all"
        ? 1
        : (page - 1) * pageSize + 1;
  const rangeEnd =
    pageSize === "all"
      ? total
      : Math.min(
          page * pageSize,
          total
        );

  return (
    <DataTableContainer
      title={t("audit.tableTitle")}
      description={t("audit.tableDescription")}
    >
      <form
        method="get"
        className={`grid gap-4 border-b p-6 ${isPlatformView ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}
      >
        {Object.entries(extraParams).map(
          ([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={value}
            />
          )
        )}

        <div className="grid gap-2">
          <label
            htmlFor="actor"
            className="text-sm text-muted-foreground"
          >
            {t("shared.labels.user")}
          </label>
          <Select
            id="actor"
            name="actor"
            defaultValue={
              filters.actor ?? ""
            }
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
          </Select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="entity"
            className="text-sm text-muted-foreground"
          >
            {t("shared.labels.entity")}
          </label>
          <Select
            id="entity"
            name="entity"
            defaultValue={
              filters.entity ?? ""
            }
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
          </Select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="action"
            className="text-sm text-muted-foreground"
          >
            {t("audit.filters.action")}
          </label>
          <Select
            id="action"
            name="action"
            defaultValue={
              filters.action ?? ""
            }
          >
            <option value="">
              {t(
                "audit.filters.allActions"
              )}
            </option>
            {actionOptions.map((action) => (
              <option
                key={action}
                value={action}
              >
                {AUDIT_ACTION_LABELS[
                  action
                ] ?? action}
              </option>
            ))}
          </Select>
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

        {isPlatformView ? (
          <div className="grid gap-2">
            <label
              htmlFor="clinicId"
              className="text-sm text-muted-foreground"
            >
              {t("audit.filters.clinic")}
            </label>
            <Select
              id="clinicId"
              name="clinicId"
              defaultValue={
                filters.clinicId ?? ""
              }
            >
              <option value="">
                {t(
                  "audit.filters.allClinics"
                )}
              </option>
              {clinicOptions.map((clinic) => (
                <option
                  key={clinic.id}
                  value={clinic.id}
                >
                  {clinic.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="grid gap-2">
          <label
            htmlFor="pageSize"
            className="text-sm text-muted-foreground"
          >
            {t("audit.filters.pageSize")}
          </label>
          <Select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
          >
            {AUDIT_LOG_PAGE_SIZE_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option === "all"
                    ? t(
                        "audit.filters.pageSizeAll"
                      )
                    : option}
                </option>
              )
            )}
          </Select>
        </div>

        <div className="flex flex-wrap items-end gap-2 lg:col-span-full">
          <Button type="submit">
            {t("shared.actions.applyFilters")}
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link href={buildExportHref(filters)}>
              {t("audit.export")}
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link
              href={
                Object.keys(extraParams)
                  .length > 0
                  ? `${basePath}?${new URLSearchParams(extraParams).toString()}`
                  : basePath
              }
            >
              {t("shared.actions.clear")}
            </Link>
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shared.labels.when")}</TableHead>
            {isPlatformView ? (
              <TableHead>{t("audit.columns.clinic")}</TableHead>
            ) : null}
            <TableHead>{t("shared.labels.user")}</TableHead>
            <TableHead>{t("shared.labels.actions")}</TableHead>
            <TableHead>{t("shared.labels.entity")}</TableHead>
            <TableHead>{t("shared.labels.details")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {logs.map((log) => {
            const clinicLabel = log.clinic
              ? log.clinic.brandName ??
                log.clinic.name
              : t("audit.details.platform");

            return (
              <TableRow key={log.id}>
                <TableCell className="align-top text-sm">
                  {formatDate(
                    log.createdAt
                  )}
                </TableCell>
                {isPlatformView ? (
                  <TableCell className="align-top">
                    {clinicLabel}
                  </TableCell>
                ) : null}
                <TableCell className="align-top">
                  <div className="flex items-center gap-2.5">
                    <CompanyAvatarMark
                      name={log.actor}
                    />
                    {log.actor}
                  </div>
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
                  <div className="space-y-3">
                    <SummaryPreview
                      metadata={
                        log.metadata
                      }
                    />
                    <AuditLogDetailsSidePanel
                      actionLabel={
                        AUDIT_ACTION_LABELS[
                          log.action
                        ]
                      }
                      actor={log.actor}
                      createdAt={formatDate(
                        log.createdAt
                      )}
                      clinicLabel={
                        isPlatformView
                          ? clinicLabel
                          : null
                      }
                      entityId={log.entityId}
                      entityLabel={
                        log.entityLabel ??
                        AUDIT_ENTITY_LABELS[
                          log.entity
                        ]
                      }
                      metadata={log.metadata}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}

          {logs.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={
                  isPlatformView ? 6 : 5
                }
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

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
          <p>
            {t("audit.pagination.range", {
              start: rangeStart,
              end: rangeEnd,
              total,
            })}
          </p>

          {pageSize !== "all" && totalPages > 1 ? (
            <div className="flex items-center gap-2">
              {page <= 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  {t("audit.pagination.previous")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link
                    href={buildPageHref(
                      filters,
                      page - 1,
                      basePath,
                      extraParams
                    )}
                  >
                    {t(
                      "audit.pagination.previous"
                    )}
                  </Link>
                </Button>
              )}
              <span>
                {t("audit.pagination.page", {
                  page,
                  totalPages,
                })}
              </span>
              {page >= totalPages ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  {t("audit.pagination.next")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link
                    href={buildPageHref(
                      filters,
                      page + 1,
                      basePath,
                      extraParams
                    )}
                  >
                    {t("audit.pagination.next")}
                  </Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </DataTableContainer>
  );
}
