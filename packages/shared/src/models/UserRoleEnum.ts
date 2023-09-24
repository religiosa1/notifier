import z from "zod";

export const userRoleEnumSchema = z.enum(["regular", "admin"]);
export const UserRoleEnum = userRoleEnumSchema.Enum;
export type UserRoleEnum = z.infer<typeof userRoleEnumSchema>;

export function getRoleName(val: UserRoleEnum): string {
  if (userRoleEnumSchema.options.includes(val)) {
    return val;
  }
  return `invalid user role value: '${val}'`;
}