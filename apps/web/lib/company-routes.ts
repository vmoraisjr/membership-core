import { buildRouteQuery } from "./route-query";

/**
 * Canonical route builders for the company workspace (Fase 6, UI-059).
 * Product terms intentionally use Cliente/Plano/Empresa while services and
 * persistence keep their established Patient/MembershipPlan/Clinic names.
 */

export type CustomerTab =
  | "overview"
  | "membership"
  | "benefits"
  | "billing"
  | "history";

export type MyCompanyTab =
  | "profile"
  | "subscription"
  | "team"
  | "resources"
  | "support";

export function clientesUrl(params?: {
  query?: string;
  status?: string;
  planId?: string;
  period?: string;
  returnTo?: string;
}) {
  return `/dashboard/clientes${buildRouteQuery(params ?? {})}`;
}

export function clienteUrl(
  clienteId: string,
  params?: {
    tab?: CustomerTab;
    returnTo?: string;
    threadId?: string;
  }
) {
  return `/dashboard/clientes/${clienteId}${buildRouteQuery(params ?? {})}`;
}

export function planosUrl(params?: {
  query?: string;
  status?: string;
}) {
  return `/dashboard/planos${buildRouteQuery(params ?? {})}`;
}

export function planoUrl(
  planoId: string,
  params?: {
    tab?: "overview" | "benefits" | "customers" | "history";
    returnTo?: string;
  }
) {
  return `/dashboard/planos/${planoId}${buildRouteQuery(params ?? {})}`;
}

export function cobrancasUrl(params?: {
  query?: string;
  status?: string;
  method?: string;
  planId?: string;
  period?: string;
  returnTo?: string;
}) {
  return `/dashboard/cobrancas${buildRouteQuery(params ?? {})}`;
}

export function atendimentosUrl(params?: {
  query?: string;
  status?: string;
  period?: string;
  clienteId?: string;
  returnTo?: string;
}) {
  return `/dashboard/atendimentos${buildRouteQuery(params ?? {})}`;
}

export function minhaEmpresaUrl(params?: {
  tab?: MyCompanyTab;
  checkout?: "success" | "canceled";
  threadId?: string;
  category?: string;
  status?: string;
  inviteCreated?: string;
  inviteEmail?: string;
  inviteRole?: string;
  inviteToken?: string;
  inviteExpiresAt?: string;
  inviteError?: string;
}) {
  return `/dashboard/minha-empresa${buildRouteQuery(params ?? {})}`;
}
