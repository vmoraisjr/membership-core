import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { getAssignableRoles } from "@/features/rbac/permissions";
import { getPlatformClinicUsersOverview } from "@/features/users/services/get-clinic-users-overview";

import { CompanyPeoplePanel } from "./company-people-panel";

type Props = {
  clinicId: string;
};

export async function CompanyPeopleTab({
  clinicId,
}: Props) {
  const [role, overview] =
    await Promise.all([
      getCurrentUserRole(),
      getPlatformClinicUsersOverview(
        clinicId
      ),
    ]);

  return (
    <CompanyPeoplePanel
      clinicId={clinicId}
      overview={overview}
      assignableRoles={[
        ...getAssignableRoles(role),
      ]}
    />
  );
}
