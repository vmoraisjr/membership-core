import { UsersPage } from "@/features/users/components/users-page";

type Props = {
  searchParams: Promise<{
    inviteCreated?: string;
    inviteEmail?: string;
    inviteRole?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
    inviteError?: string;
  }>;
};

export default async function DashboardUsersPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  return <UsersPage searchParams={params} />;
}
