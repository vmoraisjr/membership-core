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

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";

import { createClinicUserAction } from "../actions/create-clinic-user";
import { removeClinicUserAction } from "../actions/remove-clinic-user";
import { resetClinicUserPasswordAction } from "../actions/reset-clinic-user-password";
import { revokeUserInviteAction } from "../actions/revoke-user-invite";
import { updateClinicUserStatusAction } from "../actions/update-clinic-user-status";
import { updateClinicUserDetailsAction } from "../actions/update-clinic-user-details";
import type { ClinicUsersOverview } from "../services/get-clinic-users-overview";
import {
  formatDateInput,
  getRoleLabelFromValue,
  getUserStatusTone,
  getInviteStatusLabel,
  getInviteStatusTone,
} from "../utils/user-display";

import { InviteLinkBanner } from "./invite-link-banner";
import { InviteUserDialog } from "./invite-user-dialog";

type Props = {
  assignableRoles: string[];
  canManageUsers: boolean;
  currentUserId: string;
  overview: ClinicUsersOverview;
  inviteFeedback?: {
    email: string;
    role: string;
    token: string;
    expiresAt: string;
  } | null;
  inviteError?: string | null;
};

type EditableUser = ClinicUsersOverview["users"][number];
type UserRow = ClinicUsersOverview["users"][number];
type InviteRow = ClinicUsersOverview["invites"][number];

function UsersStatusTable({
  users,
  currentUserId,
  canManageUsers,
  isPending,
  onEdit,
  onResetPassword,
  emptyTitle,
  emptyDescription,
}: {
  users: UserRow[];
  currentUserId: string;
  canManageUsers: boolean;
  isPending: boolean;
  onEdit: (user: UserRow) => void;
  onResetPassword: (userId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vigência</TableHead>
          <TableHead>Último acesso</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isCurrentUser =
            user.id === currentUserId;
          const canUpdateThisUser =
            canManageUsers &&
            !isCurrentUser &&
            !user.isClinicMaster;

          return (
            <TableRow key={user.id}>
              <TableCell className="align-top">
                <div className="flex items-start gap-3">
                  <CompanyAvatarMark
                    name={user.name}
                    seed={user.id}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium">
                      {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                      {user.isClinicMaster
                        ? " · master da clínica"
                        : ""}
                      {isCurrentUser
                        ? " · sessão atual"
                        : ""}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {getRoleLabelFromValue(
                    user.role
                  )}
                </span>
              </TableCell>
              <TableCell className="align-top">
                <StatusIndicator
                  tone={getUserStatusTone(
                    user.status
                  )}
                  label={
                    user.status ===
                    AppUserStatus.ACTIVE
                      ? "Ativo"
                      : user.status ===
                          AppUserStatus.INACTIVE
                        ? "Inativo"
                        : "Pendente"
                  }
                />
              </TableCell>
              <TableCell className="align-top">
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
              </TableCell>
              <TableCell className="align-top">
                {formatDate(
                  user.lastLoginAt
                )}
              </TableCell>
              <TableCell className="align-top text-right">
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
                        onEdit(user)
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onResetPassword(
                          user.id
                        )
                      }
                      disabled={isPending}
                    >
                      Resetar senha
                    </Button>

                    <form
                      action={
                        updateClinicUserStatusAction
                      }
                      id={`update-user-status-${user.id}`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={user.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          user.status ===
                          AppUserStatus.ACTIVE
                            ? AppUserStatus.INACTIVE
                            : AppUserStatus.ACTIVE
                        }
                      />
                      <ConfirmSubmitButton
                        formId={`update-user-status-${user.id}`}
                        title={
                          user.status ===
                          AppUserStatus.ACTIVE
                            ? "Desativar usuário?"
                            : "Reativar usuário?"
                        }
                        description={`Isso atualizará o status da conta de ${user.name}.`}
                        actionLabel={
                          user.status ===
                          AppUserStatus.ACTIVE
                            ? "Desativar"
                            : "Reativar"
                        }
                        label={
                          user.status ===
                          AppUserStatus.ACTIVE
                            ? "Desativar"
                            : "Reativar"
                        }
                      />
                    </form>

                    <form
                      action={
                        removeClinicUserAction
                      }
                      id={`remove-user-${user.id}`}
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={user.id}
                      />
                      <ConfirmSubmitButton
                        formId={`remove-user-${user.id}`}
                        title="Remover usuário da clínica?"
                        description={`Isso removerá ${user.name} da equipe da clínica.`}
                        actionLabel="Remover usuário"
                        label="Remover"
                      />
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {user.isClinicMaster
                      ? "Master protegido"
                      : "Somente leitura"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function InvitesTable({
  invites,
  canManageUsers,
}: {
  invites: InviteRow[];
  canManageUsers: boolean;
}) {
  if (invites.length === 0) {
    return (
      <EmptyState
        title="Nenhum convite encontrado"
        description="Convide um novo usuário para vê-lo aqui."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>E-mail</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Convidado por</TableHead>
          <TableHead>Expira em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id}>
            <TableCell className="align-top">
              {invite.email}
            </TableCell>
            <TableCell className="align-top">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {getRoleLabelFromValue(
                  invite.role
                )}
              </span>
            </TableCell>
            <TableCell className="align-top">
              <StatusIndicator
                tone={getInviteStatusTone(
                  invite.status
                )}
                label={getInviteStatusLabel(
                  invite.status
                )}
              />
            </TableCell>
            <TableCell className="align-top text-sm text-muted-foreground">
              {invite.invitedByName ?? "—"}
            </TableCell>
            <TableCell className="align-top">
              {formatDate(invite.expiresAt)}
            </TableCell>
            <TableCell className="align-top text-right">
              {canManageUsers &&
              invite.status ===
                "PENDING" ? (
                <form
                  action={
                    revokeUserInviteAction
                  }
                  id={`revoke-invite-${invite.id}`}
                >
                  <input
                    type="hidden"
                    name="inviteId"
                    value={invite.id}
                  />
                  <ConfirmSubmitButton
                    formId={`revoke-invite-${invite.id}`}
                    title="Revogar convite?"
                    description={`O link enviado para ${invite.email} deixará de funcionar.`}
                    actionLabel="Revogar convite"
                    label="Revogar"
                  />
                </form>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Somente leitura
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function UsersOverviewPanel({
  assignableRoles,
  canManageUsers,
  currentUserId,
  overview,
  inviteFeedback,
  inviteError,
}: Props) {
  const [roleFilter, setRoleFilter] =
    useState("all");
  const [search, setSearch] =
    useState("");
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

  const matchesCommonFilters = useMemo(
    () => (user: UserRow) => {
      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.email
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesRole && matchesSearch;
    },
    [normalizedSearch, roleFilter]
  );

  const activeUsers = useMemo(
    () =>
      overview.users.filter(
        (user) =>
          user.status ===
            AppUserStatus.ACTIVE &&
          matchesCommonFilters(user)
      ),
    [matchesCommonFilters, overview.users]
  );

  const pendingUsers = useMemo(
    () =>
      overview.users.filter(
        (user) =>
          user.status ===
            AppUserStatus.PENDING &&
          matchesCommonFilters(user)
      ),
    [matchesCommonFilters, overview.users]
  );

  const inactiveUsers = useMemo(
    () =>
      overview.users.filter(
        (user) =>
          user.status ===
            AppUserStatus.INACTIVE &&
          matchesCommonFilters(user)
      ),
    [matchesCommonFilters, overview.users]
  );

  const visibleInvites = useMemo(
    () =>
      overview.invites.filter(
        (invite) =>
          normalizedSearch.length === 0 ||
          invite.email
            .toLowerCase()
            .includes(normalizedSearch)
      ),
    [normalizedSearch, overview.invites]
  );

  const filterRoles = Array.from(
    new Set(
      overview.users.map(
        (user) => user.role
      )
    )
  );

  function handleCreateUser(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        const result =
          await createClinicUserAction(
            formData
          );

        setPasswordFeedback({
          label: `Senha temporária para ${result.user.email}`,
          password:
            result.temporaryPassword,
        });
        toast.success(
          "Usuário criado com sucesso."
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
          await resetClinicUserPasswordAction(
            formData
          );
        setPasswordFeedback({
          label: `Nova senha temporária para ${result.email}`,
          password:
            result.temporaryPassword,
        });
        toast.success(
          "Senha redefinida com sucesso."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível redefinir a senha."
        );
      }
    });
  }

  function handleUpdateDetails(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        await updateClinicUserDetailsAction(
          formData
        );
        toast.success(
          "Usuário atualizado."
        );
        setEditingUser(null);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o usuário."
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {inviteFeedback ? (
        <InviteLinkBanner
          email={inviteFeedback.email}
          role={inviteFeedback.role}
          token={inviteFeedback.token}
          expiresAt={
            inviteFeedback.expiresAt
          }
        />
      ) : null}

      {inviteError ? (
        <div
          role="alert"
          className="rounded-2xl border border-transparent bg-[color:var(--color-danger-soft)] p-4 text-sm text-[color:var(--color-danger)]"
        >
          {inviteError}
        </div>
      ) : null}

      {passwordFeedback ? (
        <div className="rounded-2xl border border-transparent bg-[color:var(--color-success-soft)] p-4">
          <h2 className="font-semibold text-foreground">
            {passwordFeedback.label}
          </h2>
          <div className="mt-3 rounded-lg border border-border/70 bg-background px-3 py-2 font-mono text-sm break-all">
            {passwordFeedback.password}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            O usuário deverá trocar essa senha no primeiro acesso.
          </p>
        </div>
      ) : null}

      <div className="page-section-grid md:grid-cols-3">
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Empresa
          </p>
          <p className="mt-1 font-semibold">
            {overview.clinic.name}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            A visualização permanece restrita à clínica atual.
          </p>
        </div>
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Usuários ativos
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {activeUsers.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {inactiveUsers.length} inativo(s) · {pendingUsers.length} pendente(s).
          </p>
        </div>
        <div className="surface-subtle p-4">
          <p className="text-sm text-muted-foreground">
            Convites
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {overview.invites.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Convide para que a pessoa defina a própria senha.
          </p>
        </div>
      </div>

      {canManageUsers ? (
        <div className="workspace-section">
          <div className="workspace-section-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="workspace-section-title">
                Filtros da equipe
              </h2>
              <p className="workspace-section-description">
                Organize usuários por perfil e busca.
              </p>
            </div>
            <InviteUserDialog
              assignableRoles={
                assignableRoles
              }
            />
          </div>

          <div className="grid gap-4 border-b border-border/70 p-4 md:grid-cols-2 md:p-5">
            <label className="field-stack">
              <span className="field-label">
                Perfil
              </span>
              <Select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  Todos os perfis
                </option>
                {filterRoles.map(
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
      ) : null}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inativos ({inactiveUsers.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            Convites ({visibleInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="workspace-section">
            <UsersStatusTable
              users={activeUsers}
              currentUserId={
                currentUserId
              }
              canManageUsers={
                canManageUsers
              }
              isPending={isPending}
              onEdit={setEditingUser}
              onResetPassword={
                handleResetPassword
              }
              emptyTitle="Nenhum usuário ativo"
              emptyDescription="Ajuste os filtros ou convide um novo usuário."
            />
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="workspace-section">
            <UsersStatusTable
              users={pendingUsers}
              currentUserId={
                currentUserId
              }
              canManageUsers={
                canManageUsers
              }
              isPending={isPending}
              onEdit={setEditingUser}
              onResetPassword={
                handleResetPassword
              }
              emptyTitle="Nenhum usuário pendente"
              emptyDescription="Usuários convidados aparecem aqui até aceitarem o convite."
            />
          </div>
        </TabsContent>

        <TabsContent value="inactive">
          <div className="workspace-section">
            <UsersStatusTable
              users={inactiveUsers}
              currentUserId={
                currentUserId
              }
              canManageUsers={
                canManageUsers
              }
              isPending={isPending}
              onEdit={setEditingUser}
              onResetPassword={
                handleResetPassword
              }
              emptyTitle="Nenhum usuário inativo"
              emptyDescription="Usuários desativados aparecem aqui."
            />
          </div>
        </TabsContent>

        <TabsContent value="invites">
          <div className="workspace-section">
            <InvitesTable
              invites={visibleInvites}
              canManageUsers={
                canManageUsers
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      {canManageUsers ? (
        <details className="form-shell">
          <summary className="workspace-section-header cursor-pointer list-none">
            <h2 className="workspace-section-title">
              Criar usuário diretamente (avançado)
            </h2>
            <p className="workspace-section-description">
              Alternativa ao convite: cria a conta imediatamente com uma senha temporária.
            </p>
          </summary>
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
                  placeholder="usuario@empresa.com"
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
                <Select
                  name="role"
                  defaultValue={
                    assignableRoles[0] ??
                    AppUserRole.STAFF
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
        </details>
      ) : null}

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
              Editar usuário
            </DialogTitle>
            <DialogDescription>
              Ajuste os dados de acesso e vigência do usuário da empresa.
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
