import type { AppRole } from "@/features/auth/constants/roles";

export const APP_RESOURCES = [
  "dashboard",
  "patients",
  "plans",
  "benefits",
  "subscriptions",
  "clinic",
  "benefitUsage",
] as const;

export type AppResource =
  (typeof APP_RESOURCES)[number];

export type PermissionAction =
  | "view"
  | "manage";

const ROLE_PERMISSIONS: Record<
  AppRole,
  Record<
    AppResource,
    readonly PermissionAction[]
  >
> = {
  ADMIN: {
    dashboard: ["view", "manage"],
    patients: ["view", "manage"],
    plans: ["view", "manage"],
    benefits: ["view", "manage"],
    subscriptions: ["view", "manage"],
    clinic: ["view", "manage"],
    benefitUsage: ["view", "manage"],
  },
  MANAGER: {
    dashboard: ["view"],
    patients: ["view", "manage"],
    plans: ["view", "manage"],
    benefits: ["view", "manage"],
    subscriptions: ["view", "manage"],
    clinic: ["view"],
    benefitUsage: ["view", "manage"],
  },
  STAFF: {
    dashboard: ["view"],
    patients: ["view", "manage"],
    plans: ["view"],
    benefits: ["view"],
    subscriptions: ["view", "manage"],
    clinic: [],
    benefitUsage: ["view", "manage"],
  },
};

export const RESOURCE_LABELS: Record<
  AppResource,
  string
> = {
  dashboard: "Dashboard",
  patients: "Patients",
  plans: "Plans",
  benefits: "Benefits",
  subscriptions: "Subscriptions",
  clinic: "Clinic",
  benefitUsage: "Benefit Usage",
};

export function hasPermission(
  role: AppRole,
  resource: AppResource,
  action: PermissionAction
) {
  return ROLE_PERMISSIONS[role][
    resource
  ].includes(action);
}
