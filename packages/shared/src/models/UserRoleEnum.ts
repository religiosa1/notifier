import z from "zod";

export const UserRoleEnum = Object.freeze({
  regular: 0,
  admin: 1,
} as const);
export const userRoleEnumSchema = z.nativeEnum(UserRoleEnum);
export type UserRoleEnum = z.infer<typeof userRoleEnumSchema>;