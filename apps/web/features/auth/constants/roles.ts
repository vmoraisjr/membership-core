export const APP_ROLES = [
  "OWNER",
  "ADMIN",
  "STAFF",
  "FINANCE",
  "READ_ONLY",
] as const;

export type AppRole =
  (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole =
  "OWNER";

export const APP_ROLE_COOKIE =
  "membership-core-role";
export const APP_USER_COOKIE =
  "membership-core-user";

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
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "STAFF":
      return "Staff";
    case "FINANCE":
      return "Finance";
    case "READ_ONLY":
      return "Read only";
  }
}
