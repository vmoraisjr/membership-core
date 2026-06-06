import type { AppRole } from "@/features/auth/constants/roles";

export const APP_RESOURCES = [
  "dashboard",
  "patients",
  "crm",
  "plans",
  "benefits",
  "subscriptions",
  "clinic",
  "benefitUsage",
  "auditLogs",
  "billing",
  "contracts",
  "users",
  "modules",
] as const;

export type AppResource =
  (typeof APP_RESOURCES)[number];

export type PermissionAction =
  | "view"
  | "manage"
  | "deletePermanent";

let adminBillingAccessOverride:
  | boolean
  | undefined;

function isAdminBillingEnabled() {
  if (
    adminBillingAccessOverride !==
    undefined
  ) {
    return adminBillingAccessOverride;
  }

  return (
    process.env
      .NEXT_PUBLIC_ALLOW_ADMIN_BILLING ===
    "true"
  );
}

const ROLE_PERMISSIONS: Record<
  AppRole,
  Record<
    AppResource,
    readonly PermissionAction[]
  >
> = {
  OWNER: {
    dashboard: ["view", "manage"],
    patients: [
      "view",
      "manage",
      "deletePermanent",
    ],
    crm: [],
    plans: [
      "view",
      "manage",
      "deletePermanent",
    ],
    benefits: [
      "view",
      "manage",
      "deletePermanent",
    ],
    subscriptions: ["view", "manage"],
    clinic: ["view", "manage"],
    benefitUsage: ["view", "manage"],
    auditLogs: ["view"],
    billing: ["view", "manage"],
    contracts: ["view", "manage"],
    users: ["view", "manage"],
    modules: ["view", "manage"],
  },
  ADMIN: {
    dashboard: ["view", "manage"],
    patients: [
      "view",
      "manage",
      "deletePermanent",
    ],
    crm: [],
    plans: [
      "view",
      "manage",
      "deletePermanent",
    ],
    benefits: [
      "view",
      "manage",
      "deletePermanent",
    ],
    subscriptions: ["view", "manage"],
    clinic: ["view", "manage"],
    benefitUsage: ["view", "manage"],
    auditLogs: ["view"],
    billing: [],
    contracts: ["view", "manage"],
    users: [],
    modules: [],
  },
  STAFF: {
    dashboard: ["view"],
    patients: ["view", "manage"],
    crm: [],
    plans: [],
    benefits: ["view"],
    subscriptions: ["view", "manage"],
    clinic: [],
    benefitUsage: ["view", "manage"],
    auditLogs: [],
    billing: [],
    contracts: [],
    users: [],
    modules: [],
  },
  FINANCE: {
    dashboard: ["view"],
    patients: ["view"],
    crm: [],
    plans: ["view"],
    benefits: ["view"],
    subscriptions: ["view"],
    clinic: [],
    benefitUsage: ["view"],
    auditLogs: ["view"],
    billing: ["view", "manage"],
    contracts: ["view", "manage"],
    users: [],
    modules: [],
  },
  READ_ONLY: {
    dashboard: ["view"],
    patients: ["view"],
    crm: [],
    plans: ["view"],
    benefits: ["view"],
    subscriptions: ["view"],
    clinic: [],
    benefitUsage: ["view"],
    auditLogs: [],
    billing: [],
    contracts: ["view"],
    users: [],
    modules: [],
  },
};

export const RESOURCE_LABELS: Record<
  AppResource,
  string
> = {
  dashboard: "Dashboard",
  patients: "Patients",
  crm: "CRM",
  plans: "Plans",
  benefits: "Benefits",
  subscriptions: "Subscriptions",
  clinic: "Clinic",
  benefitUsage: "Benefit Usage",
  auditLogs: "Audit Log",
  billing: "Billing",
  contracts: "Contracts",
  users: "Users",
  modules: "Modules",
};

const ASSIGNABLE_ROLES: Record<
  AppRole,
  readonly AppRole[]
> = {
  OWNER: [
    "OWNER",
    "ADMIN",
    "STAFF",
    "FINANCE",
    "READ_ONLY",
  ],
  ADMIN: [
    "ADMIN",
    "STAFF",
    "FINANCE",
    "READ_ONLY",
  ],
  STAFF: [],
  FINANCE: [],
  READ_ONLY: [],
};

export function hasPermission(
  role: AppRole,
  resource: AppResource,
  action: PermissionAction
) {
  if (
    role === "ADMIN" &&
    resource === "billing" &&
    isAdminBillingEnabled()
  ) {
    return (
      action === "view" ||
      action === "manage"
    );
  }

  return ROLE_PERMISSIONS[role][
    resource
  ].includes(action);
}

export function canAssignRole(
  actorRole: AppRole,
  targetRole: AppRole
) {
  return ASSIGNABLE_ROLES[
    actorRole
  ].includes(targetRole);
}

export function getAssignableRoles(
  actorRole: AppRole
) {
  return ASSIGNABLE_ROLES[actorRole];
}

export function setAdminBillingAccessForTests(
  enabled: boolean
) {
  adminBillingAccessOverride = enabled;
}

export function clearAdminBillingAccessForTests() {
  adminBillingAccessOverride = undefined;
}
