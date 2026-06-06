import { UsersPage } from "@/features/users/components/users-page";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

type Props = {
  searchParams?: Promise<SearchParams>;
};

function readParam(
  searchParams: SearchParams,
  key: string
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function DashboardUsersPage({
  searchParams,
}: Props) {
  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};

  return (
    <UsersPage
      feedback={{
        inviteError: readParam(
          resolvedSearchParams,
          "inviteError"
        ),
        inviteCreated:
          readParam(
            resolvedSearchParams,
            "inviteCreated"
          ) === "1",
        inviteEmail: readParam(
          resolvedSearchParams,
          "inviteEmail"
        ),
        inviteRole: readParam(
          resolvedSearchParams,
          "inviteRole"
        ),
        inviteToken: readParam(
          resolvedSearchParams,
          "inviteToken"
        ),
        inviteExpiresAt: readParam(
          resolvedSearchParams,
          "inviteExpiresAt"
        ),
        userRoleError: readParam(
          resolvedSearchParams,
          "userRoleError"
        ),
        userRoleUpdated:
          readParam(
            resolvedSearchParams,
            "userRoleUpdated"
          ) === "1",
        updatedUserId: readParam(
          resolvedSearchParams,
          "updatedUserId"
        ),
        updatedUserName: readParam(
          resolvedSearchParams,
          "updatedUserName"
        ),
        updatedRole: readParam(
          resolvedSearchParams,
          "updatedRole"
        ),
      }}
    />
  );
}
