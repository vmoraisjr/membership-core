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
    name: "Sheep Owner",
    emailPrefix: "owner",
  },
  ADMIN: {
    name: "Sheep Admin",
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
  mustChangePassword?: boolean;
  isClinicMaster?: boolean;
  accessStartsAt?: Date | null;
  accessEndsAt?: Date | null;
};

let currentAppUserOverride:
  | CurrentAppUser
  | null
  | undefined;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensurePlatformOwner(
  defaultPasswordHash: string
) {
  const email = normalizeEmail(
    "owner+workspace@sheep.local"
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
        clinicId: null,
        role: AppUserRole.OWNER,
        status: AppUserStatus.ACTIVE,
        passwordHash:
          existingUser.passwordHash ??
          defaultPasswordHash,
      },
    });

    return;
  }

  await prisma.appUser.create({
    data: {
      clinicId: null,
      name: DEFAULT_APP_USERS.OWNER.name,
      email,
      mustChangePassword: false,
      isClinicMaster: false,
      role: AppUserRole.OWNER,
      status: AppUserStatus.ACTIVE,
      passwordHash: defaultPasswordHash,
    },
  });
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

  const defaultPasswordHash =
    hashPassword(DEFAULT_AUTH_PASSWORD);
  await ensurePlatformOwner(
    defaultPasswordHash
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
    mustChangePassword?: boolean;
    isClinicMaster?: boolean;
    accessStartsAt?: Date | null;
    accessEndsAt?: Date | null;
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
    mustChangePassword:
      "mustChangePassword" in user
        ? user.mustChangePassword
        : false,
    isClinicMaster:
      "isClinicMaster" in user
        ? user.isClinicMaster
        : false,
    accessStartsAt:
      "accessStartsAt" in user
        ? user.accessStartsAt
        : null,
    accessEndsAt:
      "accessEndsAt" in user
        ? user.accessEndsAt
        : null,
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
    session.appUser.accessStartsAt &&
    session.appUser.accessStartsAt.getTime() >
      Date.now()
  ) {
    return null;
  }

  if (
    session.appUser.accessEndsAt &&
    session.appUser.accessEndsAt.getTime() <
      Date.now()
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
