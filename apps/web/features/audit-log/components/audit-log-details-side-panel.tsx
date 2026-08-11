"use client";

import { ScrollText } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n/provider";

import { humanizeAuditMetadata } from "../utils/humanize-metadata";

type Props = {
  actionLabel: string;
  actor: string;
  createdAt: string;
  clinicLabel: string | null;
  entityId: string;
  entityLabel: string;
  metadata: Prisma.JsonValue | null;
};

export function AuditLogDetailsSidePanel({
  actionLabel,
  actor,
  createdAt,
  clinicLabel,
  entityId,
  entityLabel,
  metadata,
}: Props) {
  const t = useTranslations();
  const { changes, fields } =
    humanizeAuditMetadata(metadata);

  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <ScrollText className="size-4" />
          {t("audit.details.trigger")}
        </Button>
      </SidePanelTrigger>
      <SidePanelContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <SidePanelHeader>
          <SidePanelTitle>
            {t("audit.details.title")}
          </SidePanelTitle>
          <SidePanelDescription>
            {t(
              "audit.details.description"
            )}
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          <div className="grid gap-4">
            <div
              className={`grid gap-4 rounded-2xl border p-4 ${clinicLabel ? "md:grid-cols-3" : "md:grid-cols-2"}`}
            >
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  {t(
                    "audit.details.action"
                  )}
                </p>
                <p className="font-medium">
                  {actionLabel}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  {t(
                    "audit.details.when"
                  )}
                </p>
                <p className="font-medium">
                  {createdAt}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  {t(
                    "audit.details.who"
                  )}
                </p>
                <p className="font-medium">
                  {actor}
                </p>
              </div>
              {clinicLabel ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    {t(
                      "audit.details.where"
                    )}
                  </p>
                  <p className="font-medium">
                    {clinicLabel}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1 text-sm md:col-span-2">
                <p className="text-muted-foreground">
                  {t(
                    "audit.details.entity"
                  )}
                </p>
                <p className="font-medium">
                  {entityLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {entityId}
                </p>
              </div>
            </div>

            {changes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t(
                    "audit.details.changesTitle"
                  )}
                </p>
                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t(
                            "shared.labels.field"
                          )}
                        </TableHead>
                        <TableHead>
                          {t(
                            "audit.details.before"
                          )}
                        </TableHead>
                        <TableHead>
                          {t(
                            "audit.details.after"
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changes.map(
                        (change) => (
                          <TableRow
                            key={
                              change.label
                            }
                          >
                            <TableCell className="font-medium">
                              {
                                change.label
                              }
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {
                                change.before
                              }
                            </TableCell>
                            <TableCell>
                              {change.after}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t(
                  "audit.details.additionalDetailsTitle"
                )}
              </p>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t(
                    "audit.details.noAdditionalDetails"
                  )}
                </p>
              ) : (
                <dl className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <div
                      key={field.label}
                      className="space-y-1 text-sm"
                    >
                      <dt className="text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="font-medium">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
