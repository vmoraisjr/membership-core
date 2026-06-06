"use client";

import { useTransition } from "react";

import {
  type AppRole,
  getRoleLabel,
} from "../constants/roles";
import { setCurrentAppUser } from "../actions/set-current-app-user";

type Props = {
  currentUserId: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: AppRole;
  }>;
};

export function RoleSwitcher({
  currentUserId,
  users,
}: Props) {
  const [isPending, startTransition] =
    useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        User
      </span>

      <select
        value={currentUserId}
        disabled={isPending}
        onChange={(event) => {
          const nextUserId =
            event.target.value;

          startTransition(async () => {
            await setCurrentAppUser(
              nextUserId
            );
          });
        }}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        {users.map((user) => (
          <option
            key={user.id}
            value={user.id}
          >
            {user.name} -{" "}
            {getRoleLabel(user.role)}
          </option>
        ))}
      </select>
    </div>
  );
}
