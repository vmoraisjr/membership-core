import { SupportThreadStatus } from "@prisma/client";

import type { StatusTone } from "@/components/ui/status-indicator";

export function getSupportThreadStatusTone(
  status: SupportThreadStatus
): StatusTone {
  switch (status) {
    case SupportThreadStatus.OPEN:
      return "info";
    case SupportThreadStatus.IN_PROGRESS:
      return "warning";
    case SupportThreadStatus.WAITING_CLINIC:
    case SupportThreadStatus.WAITING_PLATFORM:
      return "neutral";
    case SupportThreadStatus.RESOLVED:
      return "success";
    case SupportThreadStatus.CLOSED:
      return "danger";
    default:
      return "neutral";
  }
}
