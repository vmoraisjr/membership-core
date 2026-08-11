"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { submitUserInviteAction } from "../actions/submit-user-invite";
import { getRoleLabelFromValue } from "../utils/user-display";

type Props = {
  assignableRoles: string[];
  defaultEmail?: string;
  defaultRole?: string;
  triggerLabel?: string;
};

export function InviteUserDialog({
  assignableRoles,
  defaultEmail,
  defaultRole,
  triggerLabel = "Convidar usuário",
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          <UserPlus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Convidar usuário
          </DialogTitle>
          <DialogDescription>
            Um link de convite será gerado para que a pessoa defina a própria senha.
          </DialogDescription>
        </DialogHeader>

        <form
          action={submitUserInviteAction}
          className="flex flex-col gap-4"
        >
          <label className="field-stack">
            <span className="field-label">
              E-mail
            </span>
            <Input
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              placeholder="nome@empresa.com"
            />
          </label>

          <label className="field-stack">
            <span className="field-label">
              Perfil
            </span>
            <Select
              name="role"
              defaultValue={
                defaultRole ??
                assignableRoles[0]
              }
            >
              {assignableRoles.map(
                (role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {getRoleLabelFromValue(
                      role
                    )}
                  </option>
                )
              )}
            </Select>
          </label>

          <Button type="submit">
            Enviar convite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
