"use client";

import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";
import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getRoleLabel,
  isAppRole,
} from "@/features/auth/constants/roles";
import {
  FEEDBACK_WARNING_MESSAGES,
  getFeedbackErrorMessage,
} from "@/lib/feedback";
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

type UserFormProps = {
  assignableRoles: string[];
  initialData?: EditableUser | null;
};

function PlatformUserForm({
  assignableRoles,
  initialData,
}: UserFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input
        type="hidden"
        name="userId"
        value={initialData?.id ?? ""}
      />

      <label className="field-stack">
        <span className="field-label">
          Nome completo
        </span>
        <Input
          name="name"
          required
          defaultValue={
            initialData?.name ?? ""
          }
          placeholder="Nome do colaborador"
        />
        <span className="field-help">
          Identificação exibida na plataforma e nos registros de auditoria.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          E-mail de acesso
        </span>
        <Input
          name="email"
          type="email"
          required
          defaultValue={
            initialData?.email ?? ""
          }
          placeholder="usuario@sheep.com"
        />
        <span className="field-help">
          Endereço usado para login e comunicação operacional.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Início da vigência
        </span>
        <Input
          name="accessStartsAt"
          type="date"
          defaultValue={formatDateInput(
            initialData?.accessStartsAt ??
              null
          )}
        />
        <span className="field-help">
          Data opcional para limitar quando o acesso pode começar.
        </span>
      </label>

      <label className="field-stack">
        <span className="field-label">
          Fim da vigência
        </span>
        <Input
          name="accessEndsAt"
          type="date"
          defaultValue={formatDateInput(
            initialData?.accessEndsAt ??
              null
          )}
        />
        <span className="field-help">
          Use quando o acesso interno precisa expirar automaticamente.
        </span>
      </label>

      <label className="field-stack md:col-span-2">
        <span className="field-label">
          Perfil de acesso
        </span>
        <select
          name="role"
          defaultValue={
            initialData?.role ??
            assignableRoles[0] ??
            AppUserRole.ADMIN
          }
          className="field-select"
        >
          {assignableRoles.map((role) => (
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
        <span className="field-help">
          Define o alcance das permissões administrativas dentro do Sheep.
        </span>
      </label>
    </div>
  );
}

export function PlatformUsersOverviewPanel({
  assignableRoles,
  canManageUsers,
  currentUserId,
  overview,
}: Props) {
  const [search, setSearch] =
    useState("");
  const [referenceNow] = useState(() =>
    Date.now()
  );
  const [roleFilter, setRoleFilter] =
    useState("all");
  const [
    userStatusFilter,
    setUserStatusFilter,
  ] = useState("all");
  const [creatingUser, setCreatingUser] =
    useState(false);
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
  const expiringUsersCount =
    overview.users.filter(
      (user) =>
        user.accessEndsAt &&
        new Date(user.accessEndsAt)
          .getTime() <
          referenceNow +
            1000 *
              60 *
              60 *
              24 *
              14
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

        setCreatingUser(false);
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
          getFeedbackErrorMessage(
            error,
            "Não foi possível criar o usuário da plataforma."
          )
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
          "Senha temporária redefinida com sucesso."
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível redefinir a senha temporária."
          )
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
          "Usuário da plataforma atualizado com sucesso."
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível atualizar o usuário da plataforma."
          )
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
          "Status do usuário atualizado com sucesso."
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível atualizar o status do usuário."
          )
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

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Escopo"
          value="Plataforma"
          hint="Essa gestão cobre apenas a equipe interna do Sheep."
          icon={
            <ShieldCheck className="size-5" />
          }
        />
        <MetricCard
          label="Usuários ativos"
          value={String(activeUsersCount)}
          hint={`${overview.users.length - activeUsersCount} conta(s) estão inativas ou pendentes.`}
          icon={<UserCog className="size-5" />}
        />
        <MetricCard
          label="Vigências próximas"
          value={String(expiringUsersCount)}
          hint="Acessos com encerramento previsto nos próximos 14 dias."
          icon={<KeyRound className="size-5" />}
        />
      </div>

      <DataTableContainer
        title="Equipe Sheep"
        description="Filtre, crie e mantenha os acessos internos da plataforma em uma fila de governança mais limpa."
        toolbar={
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)_auto]">
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
                  Buscar usuário
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Nome ou e-mail"
                    className="pl-9"
                  />
                </div>
              </label>

              {canManageUsers ? (
                <div className="flex items-end">
                  <SidePanel
                    open={creatingUser}
                    onOpenChange={
                      setCreatingUser
                    }
                  >
                    <SidePanelTrigger asChild>
                      <Button>
                        <Plus className="size-4" />
                        Novo usuário
                      </Button>
                    </SidePanelTrigger>
                    <SidePanelContent
                      className="sm:max-w-3xl"
                      aria-describedby={
                        undefined
                      }
                    >
                      <SidePanelHeader>
                        <SidePanelTitle>
                          Adicionar usuário da plataforma
                        </SidePanelTitle>
                        <SidePanelDescription>
                          Crie uma conta interna com senha temporária, perfil de acesso e vigência opcional.
                        </SidePanelDescription>
                      </SidePanelHeader>

                      <form
                        action={
                          handleCreateUser
                        }
                        className="flex min-h-0 flex-1 flex-col"
                      >
                        <SidePanelBody>
                          <div className="form-shell-body">
                            <PlatformUserForm
                              assignableRoles={
                                assignableRoles
                              }
                            />
                          </div>
                        </SidePanelBody>
                        <SidePanelFooter>
                          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-muted-foreground">
                              A senha temporária será exibida ao concluir a criação para repasse seguro ao colaborador.
                            </p>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setCreatingUser(
                                    false
                                  )
                                }
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={
                                  isPending
                                }
                              >
                                Criar usuário
                              </Button>
                            </div>
                          </div>
                        </SidePanelFooter>
                      </form>
                    </SidePanelContent>
                  </SidePanel>
                </div>
              ) : null}
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Usuário
              </TableHead>
              <TableHead>
                Perfil
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead>
                Vigência
              </TableHead>
              <TableHead>
                Último acesso
              </TableHead>
              <TableHead className="text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="p-0"
                >
                  <EmptyState
                    title="Nenhum usuário encontrado"
                    description="Ajuste os filtros para localizar usuários da plataforma."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRoleFilter("all");
                          setUserStatusFilter(
                            "all"
                          );
                          setSearch("");
                          toast.warning(
                            FEEDBACK_WARNING_MESSAGES.filtersReset
                          );
                        }}
                      >
                        Limpar filtros
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user) => {
                const isCurrentUser =
                  user.id ===
                  currentUserId;
                const canUpdateThisUser =
                  canManageUsers &&
                  !isCurrentUser;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                          {isCurrentUser
                            ? " · sessão atual"
                            : ""}
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
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getUserStatusClass(
                          user.status
                        )}`}
                      >
                        {getUserStatusLabel(
                          user.status
                        )}
                      </span>
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
                            size="icon-sm"
                            onClick={() =>
                              setEditingUser(
                                user
                              )
                            }
                            title="Editar usuário"
                            aria-label="Editar usuário"
                          >
                            <UserCog className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleResetPassword(
                                user.id
                              )
                            }
                            disabled={isPending}
                            title="Resetar senha"
                            aria-label="Resetar senha"
                          >
                            <KeyRound className="size-4" />
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DataTableContainer>

      <SidePanel
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <SidePanelContent
          className="sm:max-w-3xl"
          aria-describedby={undefined}
        >
          <SidePanelHeader>
            <SidePanelTitle>
              Editar usuário da plataforma
            </SidePanelTitle>
            <SidePanelDescription>
              Ajuste dados essenciais de acesso, vigência e perfil do colaborador interno.
            </SidePanelDescription>
          </SidePanelHeader>

          {editingUser ? (
            <form
              action={handleUpdateDetails}
              className="flex min-h-0 flex-1 flex-col"
            >
              <SidePanelBody>
                <div className="form-shell-body">
                  <PlatformUserForm
                    assignableRoles={
                      assignableRoles
                    }
                    initialData={
                      editingUser
                    }
                  />
                </div>
              </SidePanelBody>
              <SidePanelFooter>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Use vigência para acessos temporários e perfil para governança operacional.
                  </p>
                  <div className="flex gap-3">
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
                      Salvar edição
                    </Button>
                  </div>
                </div>
              </SidePanelFooter>
            </form>
          ) : null}
        </SidePanelContent>
      </SidePanel>
    </div>
  );
}
