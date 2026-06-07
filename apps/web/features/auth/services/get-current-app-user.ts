import { cookies } from "next/headers";

import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { env, isProduction } from "@/lib/env";
import {
  AUTH_SESSION_COOKIE,
  hashOpaqueToken,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

import {
  type AppRole,
} from "../constants/roles";

const DEFAULT_AUTH_PASSWORD =
  "ChangeMe123!";

const DEFAULT_APP_USERS: Record<
  AppUserRole,
  {
    name: string;
    emailPrefix: string;
  }
> = {
  OWNER: {
    name: "Owner Operator",
    emailPrefix: "owner",
  },
  ADMIN: {
    name: "Admin Operator",
    emailPrefix: "admin",
  },
  STAFF: {
    name: "Staff Operator",
    emailPrefix: "staff",
  },
  FINANCE: {
    name: "Finance Operator",
    emailPrefix: "finance",
  },
  READ_ONLY: {
    name: "Read Only Operator",
    emailPrefix: "readonly",
  },
};

export type CurrentAppUser = {
  id: string;
  clinicId: string | null;
  name: string;
  email: string;
  role: AppRole;
  status?: AppUserStatus;
};

let currentAppUserOverride:
  | CurrentAppUser
  | null
  | undefined;

function getWorkspaceSuffix(
  clinicId?: string | null
) {
  return clinicId?.trim().toLowerCase() || "workspace";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureDefaultAppUsers() {
  const existingUsersCount =
    await prisma.appUser.count();
  const allowBootstrap =
    !isProduction() ||
    env.ALLOW_AUTH_BOOTSTRAP;

  if (
    existingUsersCount > 0 &&
    !allowBootstrap
  ) {
    return prisma.appUser.findMany({
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
  }

  if (
    existingUsersCount === 0 &&
    !allowBootstrap
  ) {
    return [];
  }

  const clinic = await prisma.clinic.findFirst({
    select: {
      id: true,
    },
  });

  const workspaceSuffix =
    getWorkspaceSuffix(clinic?.id);
  const defaultPasswordHash =
    hashPassword(DEFAULT_AUTH_PASSWORD);

  await Promise.all(
    Object.entries(DEFAULT_APP_USERS).map(
      async ([role, defaults]) => {
        const email = normalizeEmail(
          `${defaults.emailPrefix}+${workspaceSuffix}@membership-core.local`
        );
        const existingUser =
          await prisma.appUser.findUnique({
            where: {
              email,
            },
            select: {
              id: true,
              passwordHash: true,
            },
          });

        if (existingUser) {
          await prisma.appUser.update({
            where: {
              id: existingUser.id,
            },
            data: {
              clinicId:
                clinic?.id ?? null,
              role:
                role as AppUserRole,
              status:
                AppUserStatus.ACTIVE,
              passwordHash:
                existingUser.passwordHash ??
                defaultPasswordHash,
            },
          });

          return;
        }

        await prisma.appUser.create({
          data: {
            clinicId: clinic?.id ?? null,
            name: defaults.name,
            email,
            role:
              role as AppUserRole,
            status:
              AppUserStatus.ACTIVE,
            passwordHash:
              defaultPasswordHash,
          },
        });
      }
    )
  );

  return prisma.appUser.findMany({
    orderBy: [
      {
        role: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function getAvailableAppUsers() {
  const users =
    await ensureDefaultAppUsers();

  return users.map((user) => ({
    id: user.id,
    clinicId: user.clinicId,
    name: user.name,
    email: user.email,
    role: user.role as AppRole,
  }));
}

export function getDefaultAuthPassword() {
  return DEFAULT_AUTH_PASSWORD;
}

export function isDefaultAuthBootstrapEnabled() {
  return (
    !isProduction() ||
    env.ALLOW_AUTH_BOOTSTRAP
  );
}

function toCurrentAppUser(
  user: {
    id: string;
    clinicId: string | null;
    name: string;
    email: string;
    role: AppUserRole;
    status: AppUserStatus;
  }
): CurrentAppUser {
  return {
    id: user.id,
    clinicId: user.clinicId,
    name: user.name,
    email: user.email,
    role: user.role as AppRole,
    status: user.status,
  };
}

export async function getCurrentAppUser() {
  if (
    currentAppUserOverride !== undefined
  ) {
    return currentAppUserOverride;
  }

  const cookieStore = await cookies();
  const rawSessionToken =
    cookieStore.get(
      AUTH_SESSION_COOKIE
    )?.value;

  if (!rawSessionToken) {
    return null;
  }

  const session =
    await prisma.authSession.findUnique({
      where: {
        sessionTokenHash:
          hashOpaqueToken(
            rawSessionToken
          ),
      },
      include: {
        appUser: true,
      },
    });

  if (!session) {
    return null;
  }

  if (
    session.appUser.status !==
    AppUserStatus.ACTIVE
  ) {
    return null;
  }

  if (
    session.expiresAt.getTime() <=
    Date.now()
  ) {
    return null;
  }

  await prisma.authSession.update({
    where: {
      id: session.id,
    },
    data: {
      lastSeenAt: new Date(),
    },
  });

  return toCurrentAppUser(
    session.appUser
  );
}

export function setCurrentAppUserForTests(
  user: CurrentAppUser | null
) {
  currentAppUserOverride = user;
}

export function clearCurrentAppUserForTests() {
  currentAppUserOverride = undefined;
}

export async function requireCurrentAppUser() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    throw new Error(
      "Authentication required."
    );
  }

  return currentUser;
}
