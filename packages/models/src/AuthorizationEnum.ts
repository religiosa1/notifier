import z from "zod";

export const AuthorizationEnum = Object.freeze({
  pending: 0,
  accepted: 1,
  declined: 2
} as const);
export type AuthorizationEnum = (typeof AuthorizationEnum)[keyof typeof AuthorizationEnum];
export const authorizationEnumSchema = z.nativeEnum(AuthorizationEnum);