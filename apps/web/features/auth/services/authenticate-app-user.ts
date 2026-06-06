import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

type AuthenticateAppUserInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
