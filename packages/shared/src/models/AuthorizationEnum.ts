import z from "zod";

export const AuthorizationEnum = Object.freeze({
  pending: 0,
  accepted: 1,
  declined: 2
} as const);
export type AuthorizationEnum = (typeof AuthorizationEnum)[keyof typeof AuthorizationEnum];
export const authorizationEnumSchema = z.nativeEnum(AuthorizationEnum);

export function getAuthorizationStatusName(val: AuthorizationEnum) {
  switch (val) {
    case 0: return "pending";
    case 1: return "accepted";
    case 2: return "declined";
    default: return `invalid authorization status value: '${val}'`;
  }
}