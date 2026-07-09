import { AppUserStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

type AuthenticateAppUserInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUserWithinAccessWindow(user: {
  accessStartsAt: Date | null;
  accessEndsAt: Date | null;
}) {
  const now = Date.now();

  if (
    user.accessStartsAt &&
    user.accessStartsAt.getTime() > now
  ) {
    return false;
  }

  if (
    user.accessEndsAt &&
    user.accessEndsAt.getTime() < now
  ) {
    return false;
  }

  return true;
}

export async function authenticateAppUser({
  email,
  password,
}: AuthenticateAppUserInput) {
  const user = await prisma.appUser.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  if (
    user.status !==
    AppUserStatus.ACTIVE
  ) {
    return null;
  }

  if (!isUserWithinAccessWindow(user)) {
    return null;
  }

  const isValid =
    verifyPassword(
      password,
      user.passwordHash
    );

  if (!isValid) {
    return null;
  }

  return user;
}
