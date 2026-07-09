import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";
import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => {
    if (
      value == null ||
      value === ""
    ) {
      return undefined;
    }

    return value;
  },
  z.string().optional()
);

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

const clinicUserFields = {
  name: z
    .string()
    .trim()
    .min(3, "Nome é obrigatório."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido."),
  role: z.nativeEnum(AppUserRole),
  accessStartsAt: optionalDate,
  accessEndsAt: optionalDate,
};

function withAccessWindowValidation<
  T extends z.ZodRawShape,
>(schema: z.ZodObject<T>) {
  return schema.superRefine(
    (data, ctx) => {
      if (
        data.accessStartsAt &&
        data.accessEndsAt &&
        new Date(
          data.accessEndsAt
        ).getTime() <
          new Date(
            data.accessStartsAt
          ).getTime()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accessEndsAt"],
          message:
            "A data fim não pode ser anterior à data início.",
        });
      }
    }
  );
}

export const createClinicUserSchema =
  withAccessWindowValidation(
    z.object(clinicUserFields)
  );

export const updateClinicUserSchema =
  withAccessWindowValidation(
    z.object({
      userId: z
        .string()
        .min(1, "Usuário é obrigatório."),
      ...clinicUserFields,
    })
  );
