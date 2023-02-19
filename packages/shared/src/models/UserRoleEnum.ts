import z from "zod";

export const UserRoleEnum = Object.freeze({
  regular: 0,
  admin: 1,
} as const);
export const userRoleEnumSchema = z.nativeEnum(UserRoleEnum);
export type UserRoleEnum = z.infer<typeof userRoleEnumSchema>;

export function getRoleName(val: UserRoleEnum) {
  switch (val) {
    case 0: return "regular";
    case 1: return "admin";
    default: return `invalid user role value: '${val}'`;
  }
}