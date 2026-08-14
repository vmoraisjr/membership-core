"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppUserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFeedbackErrorMessage } from "@/lib/feedback";
import { formatDate } from "@/lib/formatters";
import { getRoleLabelFromValue } from "@/features/users/utils/user-display";
import type { ClinicUsersOverview } from "@/features/users/services/get-clinic-users-overview";

import {
  createCompanyUserAction,
  removeCompanyUserAction,
  revokeCompanyUserInviteAction,
  updateCompanyUserDetailsAction,
  updateCompanyUserStatusAction,
} from "../actions/manage-company-users";
import { CompanyUserPasswordActions } from "./company-user-password-actions";

function getUserStatusLabel(
  status: string
) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "INACTIVE")
    return "Inativo";
  return "Pendente";
}

function getUserStatusTone(
  status: string
): "success" | "neutral" | "warning" {
  if (status === "ACTIVE")
    return "success";
  if (status === "INACTIVE")
    return "neutral";
  return "warning";
}

type ClinicUser =
  ClinicUsersOverview["users"][number];

type Props = {
  clinicId: string;
  overview: ClinicUsersOverview;
  assignableRoles: AppUserRole[];
};

export function CompanyPeoplePanel({
  clinicId,
  overview,
  assignableRoles,
}: Props) {
  const [isPending, startTransition] =
    useTransition();
  const [createOpen, setCreateOpen] =
    useState(false);
  const [
    createdPassword,
    setCreatedPassword,
  ] = useState<string | null>(null);
  const [
    passwordVisible,
    setPasswordVisible,
  ] = useState(false);
  const [
    editingUser,
    setEditingUser,
  ] = useState<ClinicUser | null>(null);

  function handleCreate(
    formData: FormData
  ) {
    formData.set("clinicId", clinicId);
    startTransition(async () => {
      try {
        const result =
          await createCompanyUserAction(
            formData
          );
        setCreatedPassword(
          result.temporaryPassword
        );
        toast.success(
          `Usuário ${result.user.email} criado com sucesso.`
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível criar o usuário."
          )
        );
      }
    });
  }

  function handleUpdateDetails(
    formData: FormData
  ) {
    formData.set("clinicId", clinicId);
    startTransition(async () => {
      try {
        await updateCompanyUserDetailsAction(
          formData
        );
        toast.success(
          "Usuário atualizado."
        );
        setEditingUser(null);
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível atualizar o usuário."
          )
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Pessoas
          </h2>
          <p className="text-sm text-muted-foreground">
            Todos os usuários desta
            empresa — não confundir com a
            Equipe Sheep (interna à
            plataforma).
          </p>
        </div>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              setCreatedPassword(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
            >
              <UserPlus className="size-4" />
              Adicionar usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Adicionar usuário
              </DialogTitle>
              <DialogDescription>
                Cria um usuário ativo
                nesta empresa com senha
                temporária.
              </DialogDescription>
            </DialogHeader>

            {createdPassword ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Usuário criado.
                  Compartilhe a senha
                  temporária abaixo — o
                  próximo acesso exigirá
                  troca obrigatória.
                </p>
                <div className="relative">
                  <Input
                    readOnly
                    type={
                      passwordVisible
                        ? "text"
                        : "password"
                    }
                    value={
                      createdPassword
                    }
                  />
                  <button
                    type="button"
                    aria-label="Mostrar senha"
                    onClick={() =>
                      setPasswordVisible(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {passwordVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() =>
                      setCreateOpen(
                        false
                      )
                    }
                  >
                    Concluir
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form
                action={handleCreate}
                className="space-y-3"
              >
                <div className="field-stack">
                  <label className="field-label">
                    Nome
                  </label>
                  <Input
                    name="name"
                    required
                  />
                </div>
                <div className="field-stack">
                  <label className="field-label">
                    E-mail
                  </label>
                  <Input
                    type="email"
                    name="email"
                    required
                  />
                </div>
                <div className="field-stack">
                  <label className="field-label">
                    Perfil
                  </label>
                  <Select
                    name="role"
                    defaultValue={
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
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isPending}
                  >
                    Criar usuário
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {overview.users.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description="Adicione o primeiro usuário desta empresa."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Usuário
              </TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                Último acesso
              </TableHead>
              <TableHead className="text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.users.map(
              (user) => (
                <TableRow key={user.id}>
                  <TableCell className="align-top">
                    <p className="font-medium text-foreground">
                      {user.name}
                      {user.isClinicMaster ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (master)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell className="align-top">
                    {getRoleLabelFromValue(
                      user.role
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusIndicator
                      tone={getUserStatusTone(
                        user.status
                      )}
                      label={getUserStatusLabel(
                        user.status
                      )}
                    />
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDate(
                      user.lastLoginAt
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {user.isClinicMaster ? (
                      <span className="text-xs text-muted-foreground">
                        Gerencie pelo
                        painel &ldquo;Editar
                        empresa&rdquo;
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <CompanyUserPasswordActions
                          userId={
                            user.id
                          }
                          userEmail={
                            user.email
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingUser(
                              user
                            )
                          }
                        >
                          Editar
                        </Button>
                        <form
                          id={`company-user-status-${user.id}`}
                          action={
                            updateCompanyUserStatusAction
                          }
                        >
                          <input
                            type="hidden"
                            name="clinicId"
                            value={
                              clinicId
                            }
                          />
                          <input
                            type="hidden"
                            name="userId"
                            value={
                              user.id
                            }
                          />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              user.status ===
                              "ACTIVE"
                                ? "INACTIVE"
                                : "ACTIVE"
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`company-user-status-${user.id}`}
                            title={
                              user.status ===
                              "ACTIVE"
                                ? `Desativar ${user.name}?`
                                : `Reativar ${user.name}?`
                            }
                            description="Isso muda o acesso deste usuário à plataforma imediatamente."
                            actionLabel={
                              user.status ===
                              "ACTIVE"
                                ? "Desativar"
                                : "Reativar"
                            }
                            label={
                              user.status ===
                              "ACTIVE"
                                ? "Desativar"
                                : "Reativar"
                            }
                            variant="outline"
                            size="sm"
                          />
                        </form>
                        <form
                          id={`company-user-remove-${user.id}`}
                          action={
                            removeCompanyUserAction
                          }
                        >
                          <input
                            type="hidden"
                            name="clinicId"
                            value={
                              clinicId
                            }
                          />
                          <input
                            type="hidden"
                            name="userId"
                            value={
                              user.id
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`company-user-remove-${user.id}`}
                            title={`Remover ${user.name} da empresa?`}
                            description="Essa ação exclui o acesso do usuário permanentemente."
                            actionLabel="Remover"
                            label="Remover"
                            variant="destructive"
                            size="sm"
                          />
                        </form>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}

      {overview.invites.filter(
        (invite) =>
          invite.status === "PENDING"
      ).length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Convites pendentes
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  E-mail
                </TableHead>
                <TableHead>
                  Perfil
                </TableHead>
                <TableHead>
                  Expira em
                </TableHead>
                <TableHead className="text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.invites
                .filter(
                  (invite) =>
                    invite.status ===
                    "PENDING"
                )
                .map((invite) => (
                  <TableRow
                    key={invite.id}
                  >
                    <TableCell>
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      {getRoleLabelFromValue(
                        invite.role
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(
                        invite.expiresAt
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        id={`company-invite-revoke-${invite.id}`}
                        action={
                          revokeCompanyUserInviteAction
                        }
                      >
                        <input
                          type="hidden"
                          name="clinicId"
                          value={
                            clinicId
                          }
                        />
                        <input
                          type="hidden"
                          name="inviteId"
                          value={
                            invite.id
                          }
                        />
                        <ConfirmSubmitButton
                          formId={`company-invite-revoke-${invite.id}`}
                          title="Revogar convite?"
                          description={`O link enviado para ${invite.email} deixará de funcionar.`}
                          actionLabel="Revogar convite"
                          label="Revogar"
                          variant="outline"
                          size="sm"
                        />
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar usuário
            </DialogTitle>
            <DialogDescription>
              Atualize dados e perfil
              deste usuário.
            </DialogDescription>
          </DialogHeader>

          {editingUser ? (
            <form
              action={
                handleUpdateDetails
              }
              className="space-y-3"
            >
              <input
                type="hidden"
                name="userId"
                value={editingUser.id}
              />
              <div className="field-stack">
                <label className="field-label">
                  Nome
                </label>
                <Input
                  name="name"
                  defaultValue={
                    editingUser.name
                  }
                  required
                />
              </div>
              <div className="field-stack">
                <label className="field-label">
                  E-mail
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={
                    editingUser.email
                  }
                  required
                />
              </div>
              <div className="field-stack">
                <label className="field-label">
                  Perfil
                </label>
                <Select
                  name="role"
                  defaultValue={
                    editingUser.role
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
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setEditingUser(null)
                  }
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
