import z from "zod";

export const UserRoleEnum = Object.freeze({
	regular: 0,
	admin: 1,
});
export type UserRoleEnum = typeof UserRoleEnum[keyof typeof UserRoleEnum];
export const userRoleEnumSchema = z.nativeEnum(UserRoleEnum);

export function getRoleName(val: UserRoleEnum): string {
	for (const [key, value] of Object.entries(UserRoleEnum)) {
		if (value === val) {
			return key;
		}
	}
	return `invalid user role value: '${val}'`;
}