/**
 * Canonical route builders for the platform-owner navigation (Fase 4, UI-049).
 * Centralizes URL construction so old→new redirects and internal links stay
 * in sync as later tasks (UI-050+) evolve tab content.
 */

import { buildRouteQuery } from "./route-query";

export function empresasUrl(params?: {
  status?: string;
  planId?: string;
  query?: string;
}) {
  return `/dashboard/empresas${buildRouteQuery(params ?? {})}`;
}

export function empresaUrl(
  empresaId: string,
  params?: {
    tab?: string;
    auditActor?: string;
    auditFrom?: string;
    auditTo?: string;
    threadId?: string;
    category?: string;
    status?: string;
  }
) {
  return `/dashboard/empresas/${empresaId}${buildRouteQuery(params ?? {})}`;
}

export function planosComerciaisUrl(params?: {
  tab?: "plans" | "modules";
  query?: string;
  availability?: string;
}) {
  return `/dashboard/planos-comerciais${buildRouteQuery(params ?? {})}`;
}

export function chamadosUrl(params?: {
  threadId?: string;
  category?: string;
  status?: string;
  clinicId?: string;
}) {
  return `/dashboard/chamados${buildRouteQuery(params ?? {})}`;
}

export function administracaoUrl(params?: {
  tab?: "team" | "audit";
  actor?: string;
  entity?: string;
  action?: string;
  date?: string;
  clinicId?: string;
  page?: string | number;
  pageSize?: string;
  inviteCreated?: string;
  inviteEmail?: string;
  inviteRole?: string;
  inviteToken?: string;
  inviteExpiresAt?: string;
  inviteError?: string;
}) {
  return `/dashboard/administracao${buildRouteQuery(params ?? {})}`;
}
