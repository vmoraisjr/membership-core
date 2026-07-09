import {
  type CurrentAppUser,
  requireCurrentAppUser,
} from "./get-current-app-user";

export type CurrentWorkspace =
  | {
      type: "platform";
      currentUser: CurrentAppUser;
      canManagePlatform: boolean;
    }
  | {
      type: "clinic";
      currentUser: CurrentAppUser;
      clinicId: string;
    };

export function resolveCurrentWorkspace(
  currentUser: CurrentAppUser
): CurrentWorkspace {
  if (!currentUser.clinicId) {
    return {
      type: "platform",
      currentUser,
      canManagePlatform:
        currentUser.role === "OWNER" ||
        currentUser.role === "ADMIN",
    };
  }

  return {
    type: "clinic",
    currentUser,
    clinicId: currentUser.clinicId,
  };
}

export async function getCurrentWorkspace() {
  const currentUser =
    await requireCurrentAppUser();

  return resolveCurrentWorkspace(
    currentUser
  );
}

export function isPlatformWorkspace(
  workspace: CurrentWorkspace
) {
  return workspace.type === "platform";
}

