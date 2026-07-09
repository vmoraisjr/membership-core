"use client";

import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  getRoleLabel,
  isAppRole,
} from "@/features/auth/constants/roles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/formatters";

import { createPlatformUserAction } from "../actions/create-platform-user";
import { resetPlatformUserPasswordAction } from "../actions/reset-platform-user-password";
import { updatePlatformUserDetailsAction } from "../actions/update-platform-user-details";
import { updatePlatformUserStatusAction } from "../actions/update-platform-user-status";
import type { PlatformUsersOverview } from "../services/get-platform-users-overview";

type Props = {
  assignableRoles: string[];
  canManageUsers: boolean;
  currentUserId: string;
  overview: PlatformUsersOverview;
};

type EditableUser =
  PlatformUsersOverview["users"][number];

function getRoleLabelFromValue(
  role: string | undefined
) {
  if (!role || !isAppRole(role)) {
    return "-";
  }

  return getRoleLabel(role);
}

function getUserStatusLabel(
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

function getUserStatusClass(
  status: AppUserStatus
) {
  switch (status) {
    case AppUserStatus.ACTIVE:
      return "bg-emerald-100 text-emerald-700";
    case AppUserStatus.INACTIVE:
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function formatDateInput(
  value: Date | null
) {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toISOString()
    .slice(0, 10);
}

export function PlatformUsersOverviewPanel({
  assignableRoles,
  canManageUsers,
  currentUserId,
  overview,
}: Props) {
  const [search, setSearch] =
    useState("");
  const [roleFilter, setRoleFilter] =
    useState("all");
  const [
    userStatusFilter,
    setUserStatusFilter,
  ] = useState("all");
  const [editingUser, setEditingUser] =
    useState<EditableUser | null>(null);
  const [
    passwordFeedback,
    setPasswordFeedback,
  ] = useState<{
    label: string;
    password: string;
  } | null>(null);
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const normalizedSearch =
    search.trim().toLowerCase();
  const activeUsersCount =
    overview.users.filter(
      (user) =>
        user.status ===
        AppUserStatus.ACTIVE
    ).length;
  const filterRoles = Array.from(
    new Set(
      overview.users.map(
        (user) => user.role
      )
    )
  );

  const visibleUsers = useMemo(
    () =>
      overview.users.filter((user) => {
        const matchesRole =
          roleFilter === "all" ||
          user.role === roleFilter;
        const matchesStatus =
          userStatusFilter === "all" ||
          user.status ===
            userStatusFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          user.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          user.email
            .toLowerCase()
            .includes(normalizedSearch);

        return (
          matchesRole &&
          matchesStatus &&
          matchesSearch
        );
      }),
    [
      normalizedSearch,
      overview.users,
      roleFilter,
      userStatusFilter,
    ]
  );

  function handleCreateUser(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        const result =
          await createPlatformUserAction(
            formData
          );

        setPasswordFeedback({
          label: `Senha temporária para ${result.user.email}`,
          password:
            result.temporaryPassword,
        });
        toast.success(
          "Usuário da plataforma criado com sucesso."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível criar o usuário."
        );
      }
    });
  }

  function handleResetPassword(
    userId: string
  ) {
    const formData = new FormData();
    formData.set("userId", userId);

    startTransition(async () => {
      try {
        const result =
          await resetPlatformUserPasswordAction(
            formData
          );

        setPasswordFeedback({
          label: `Nova senha temporária para ${result.email}`,
          password:
            result.temporaryPassword,
        });
        toast.success(
          "Senha temporária redefinida."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível resetar a senha."
        );
      }
    });
  }

  function handleUpdateDetails(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        await updatePlatformUserDetailsAction(
          formData
        );
        setEditingUser(null);
        toast.success(
          "Usuário atualizado."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o usuário."
        );
      }
    });
  }

  function handleToggleStatus(
    userId: string,
    status: AppUserStatus
  ) {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set(
      "status",
      status === AppUserStatus.ACTIVE
        ? AppUserStatus.INACTIVE
        : AppUserStatus.ACTIVE
    );

    startTransition(async () => {
      try {
        await updatePlatformUserStatusAction(
          formData
        );
        toast.success(
          "Status atualizado."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o status."
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {passwordFeedback ? (
        <div className="rounded-2xl border bg-emerald-50/70 p-4">
          <h2 className="font-semibold text-emerald-900">
            {passwordFeedback.label}
          </h2>
          <div className="mt-3 rounded-lg border border-emerald-200 bg-background px-3 py-2 font-mono text-sm break-all">
            {passwordFeedback.password}
          </div>
          <p className="mt-2 text-sm text-emerald-800">
            O usuário deverá trocar essa senha no primeiro acesso.
          </p>
        </div>
      ) : null}

      <div className="page-section-grid md:grid-cols-3">
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Escopo
          </p>
          <p className="mt-1 font-semibold">
            Plataforma
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Esta tela não lista equipes das clínicas.
          </p>
        </div>
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Usuários ativos
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {activeUsersCount}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {overview.users.length - activeUsersCount} inativo(s) na plataforma.
          </p>
        </div>
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Gestão global
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {overview.users.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Apenas ações essenciais de governança.
          </p>
        </div>
      </div>

      {canManageUsers ? (
        <div className="form-shell">
          <div className="workspace-section-header">
            <h2 className="workspace-section-title">
              Adicionar usuário da plataforma
            </h2>
            <p className="workspace-section-description">
              Crie um usuário interno da plataforma com senha temporária e vigência opcional.
            </p>
          </div>
          <div className="form-shell-body">
            <form
              action={handleCreateUser}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
            >
              <label className="field-stack">
                <span className="field-label">
                  Nome
                </span>
                <Input
                  name="name"
                  required
                  placeholder="Nome do usuário"
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  E-mail
                </span>
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@plataforma.com"
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  Data início
                </span>
                <Input
                  name="accessStartsAt"
                  type="date"
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  Data fim
                </span>
                <Input
                  name="accessEndsAt"
                  type="date"
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  Perfil
                </span>
                <select
                  name="role"
                  defaultValue={
                    assignableRoles[0] ??
                    AppUserRole.ADMIN
                  }
                  className="field-select"
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
                </select>
              </label>

              <div className="md:col-span-2 xl:col-span-5">
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  Adicionar usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="workspace-section">
        <div className="workspace-section-header">
          <h2 className="workspace-section-title">
            Filtros
          </h2>
          <p className="workspace-section-description">
            Localize rapidamente a equipe interna da plataforma.
          </p>
        </div>

        <div className="grid gap-4 border-b border-border/70 p-4 md:grid-cols-3 md:p-5">
          <label className="field-stack">
            <span className="field-label">
              Perfil
            </span>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="field-select"
            >
              <option value="all">
                Todos os perfis
              </option>
              {filterRoles.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {getRoleLabelFromValue(
                    role
                  )}
                </option>
              ))}
            </select>
          </label>

          <label className="field-stack">
            <span className="field-label">
              Status
            </span>
            <select
              value={userStatusFilter}
              onChange={(event) =>
                setUserStatusFilter(
                  event.target.value
                )
              }
              className="field-select"
            >
              <option value="all">
                Todos
              </option>
              <option
                value={AppUserStatus.ACTIVE}
              >
                Ativos
              </option>
              <option
                value={AppUserStatus.INACTIVE}
              >
                Inativos
              </option>
            </select>
          </label>

          <label className="field-stack">
            <span className="field-label">
              Buscar
            </span>
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar por nome ou e-mail"
            />
          </label>
        </div>
      </div>

      <div className="workspace-section">
        <div className="workspace-section-header">
          <h2 className="workspace-section-title">
            Usuários da plataforma
          </h2>
          <p className="workspace-section-description">
            Somente leitura ou ações essenciais de governança.
          </p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Usuário
                </th>
                <th className="py-2">
                  Perfil
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Vigência
                </th>
                <th className="py-2">
                  Último acesso
                </th>
                <th className="py-2 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-0"
                  >
                    <EmptyState
                      title="Nenhum usuário encontrado"
                      description="Ajuste os filtros para localizar usuários da plataforma."
                    />
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => {
                  const isCurrentUser =
                    user.id ===
                    currentUserId;
                  const canUpdateThisUser =
                    canManageUsers &&
                    !isCurrentUser;

                  return (
                    <tr
                      key={user.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        <div className="font-medium">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                          {isCurrentUser
                            ? " · sessão atual"
                            : ""}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {getRoleLabelFromValue(
                            user.role
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getUserStatusClass(
                            user.status
                          )}`}
                        >
                          {getUserStatusLabel(
                            user.status
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>
                            Início:{" "}
                            {formatDate(
                              user.accessStartsAt
                            )}
                          </div>
                          <div>
                            Fim:{" "}
                            {formatDate(
                              user.accessEndsAt
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        {formatDate(
                          user.lastLoginAt
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground">
                            Gerencie sua própria conta fora desta tela
                          </span>
                        ) : canUpdateThisUser ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setEditingUser(
                                  user
                                )
                              }
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                handleResetPassword(
                                  user.id
                                )
                              }
                              disabled={isPending}
                            >
                              Resetar senha
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                handleToggleStatus(
                                  user.id,
                                  user.status
                                )
                              }
                              disabled={isPending}
                            >
                              {user.status ===
                              AppUserStatus.ACTIVE
                                ? "Desativar"
                                : "Reativar"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Somente leitura
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              Editar usuário da plataforma
            </DialogTitle>
            <DialogDescription>
              Ajuste dados essenciais de acesso e vigência do usuário interno.
            </DialogDescription>
          </DialogHeader>

          {editingUser ? (
            <form
              action={handleUpdateDetails}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="userId"
                value={editingUser.id}
              />

              <label className="field-stack">
                <span className="field-label">
                  Nome
                </span>
                <Input
                  name="name"
                  required
                  defaultValue={
                    editingUser.name
                  }
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  E-mail
                </span>
                <Input
                  name="email"
                  type="email"
                  required
                  defaultValue={
                    editingUser.email
                  }
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  Data início
                </span>
                <Input
                  name="accessStartsAt"
                  type="date"
                  defaultValue={formatDateInput(
                    editingUser.accessStartsAt
                  )}
                />
              </label>

              <label className="field-stack">
                <span className="field-label">
                  Data fim
                </span>
                <Input
                  name="accessEndsAt"
                  type="date"
                  defaultValue={formatDateInput(
                    editingUser.accessEndsAt
                  )}
                />
              </label>

              <label className="field-stack md:col-span-2">
                <span className="field-label">
                  Perfil
                </span>
                <select
                  name="role"
                  defaultValue={
                    editingUser.role
                  }
                  className="field-select"
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
                </select>
              </label>

              <div className="flex gap-3 md:col-span-2">
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  Salvar edição
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setEditingUser(null)
                  }
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
