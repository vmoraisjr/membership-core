import { AppUserStatus } from "@prisma/client";

import {
  getRoleLabel,
  isAppRole,
} from "@/features/auth/constants/roles";
import type { StatusTone } from "@/components/ui/status-indicator";

export function getRoleLabelFromValue(
  role: string | undefined
) {
  if (!role || !isAppRole(role)) {
    return "-";
  }

  return getRoleLabel(role);
}

export function getUserStatusLabel(
  status: AppUserStatus
) {
  switch (status) {
    case AppUserStatus.ACTIVE:
      return "Ativo";
    case AppUserStatus.INACTIVE:
      return "Inativo";
    default:
      return "Pendente";
  }
}

export function getUserStatusTone(
  status: AppUserStatus
): StatusTone {
  switch (status) {
    case AppUserStatus.ACTIVE:
      return "success";
    case AppUserStatus.INACTIVE:
      return "neutral";
    default:
      return "warning";
  }
}

export type InviteStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export function getInviteStatusLabel(
  status: InviteStatus
) {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "ACCEPTED":
      return "Aceito";
    case "REVOKED":
      return "Revogado";
    case "EXPIRED":
      return "Expirado";
  }
}

export function getInviteStatusTone(
  status: InviteStatus
): StatusTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
      return "success";
    case "REVOKED":
    case "EXPIRED":
      return "danger";
  }
}

export function formatDateInput(
  value: Date | null
) {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toISOString()
    .slice(0, 10);
}
