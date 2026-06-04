"use client";

import { useTransition } from "react";

import {
  APP_ROLES,
  type AppRole,
  getRoleLabel,
} from "../constants/roles";
import { setCurrentUserRole } from "../actions/set-current-user-role";

type Props = {
  currentRole: AppRole;
};

export function RoleSwitcher({
  currentRole,
}: Props) {
  const [isPending, startTransition] =
    useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Role
      </span>

      <select
        value={currentRole}
        disabled={isPending}
        onChange={(event) => {
          const nextRole =
            event.target.value as AppRole;

          startTransition(async () => {
            await setCurrentUserRole(
              nextRole
            );
          });
        }}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        {APP_ROLES.map((role) => (
          <option
            key={role}
            value={role}
          >
            {getRoleLabel(role)}
          </option>
        ))}
      </select>
    </div>
  );
}
