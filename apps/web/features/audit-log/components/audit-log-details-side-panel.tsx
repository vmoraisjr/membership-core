"use client";

import { FileJson } from "lucide-react";
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

type Props = {
  actionLabel: string;
  actor: string;
  createdAt: string;
  entityId: string;
  entityLabel: string;
  metadata: Prisma.JsonValue | null;
};

function formatMetadata(
  metadata: Prisma.JsonValue | null
) {
  if (!metadata) {
    return "Sem payload adicional registrado.";
  }

  return JSON.stringify(
    metadata,
    null,
    2
  );
}

export function AuditLogDetailsSidePanel({
  actionLabel,
  actor,
  createdAt,
  entityId,
  entityLabel,
  metadata,
}: Props) {
  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <FileJson className="size-4" />
          Ver payload
        </Button>
      </SidePanelTrigger>
      <SidePanelContent
        className="sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <SidePanelHeader>
          <SidePanelTitle>
            Detalhe do evento de auditoria
          </SidePanelTitle>
          <SidePanelDescription>
            Revise o contexto completo do evento antes de agir em plataforma ou clínica.
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          <div className="grid gap-4">
            <div className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Ação
                </p>
                <p className="font-medium">
                  {actionLabel}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Quando
                </p>
                <p className="font-medium">
                  {createdAt}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Ator
                </p>
                <p className="font-medium">
                  {actor}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Entidade
                </p>
                <p className="font-medium">
                  {entityLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {entityId}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Payload completo
              </p>
              <pre className="overflow-x-auto rounded-2xl border bg-[color:var(--color-surface-subtle)] p-4 text-xs leading-6 text-foreground">
                {formatMetadata(metadata)}
              </pre>
            </div>
          </div>
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
