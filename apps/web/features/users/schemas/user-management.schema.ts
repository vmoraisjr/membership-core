import { AppUserStatus } from "@prisma/client";
import { z } from "zod";

export const userLifecycleSchema =
  z.object({
    userId: z
      .string()
      .min(1, "User is required."),
  });

export const updateUserStatusSchema =
  z.object({
    userId: z
      .string()
      .min(1, "User is required."),
    status: z.nativeEnum(
      AppUserStatus
    ),
  });

export const revokeInviteSchema =
  z.object({
    inviteId: z
      .string()
      .min(1, "Invite is required."),
  });
