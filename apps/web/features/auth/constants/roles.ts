export const APP_ROLES = [
  "ADMIN",
  "MANAGER",
  "STAFF",
] as const;

export type AppRole =
  (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole =
  "ADMIN";

export const APP_ROLE_COOKIE =
  "membership-core-role";

export function isAppRole(
  value: string
): value is AppRole {
  return APP_ROLES.includes(
    value as AppRole
  );
}

export function getRoleLabel(
  role: AppRole
) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "STAFF":
      return "Staff";
  }
}
