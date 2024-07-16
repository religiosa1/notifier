import z from "zod";

export const AuthorizationEnum = Object.freeze({
	pending: 0,
	accepted: 1,
	declined: 2,
});
export type AuthorizationEnum = typeof AuthorizationEnum[keyof typeof AuthorizationEnum];
export const authorizationEnumSchema = z.nativeEnum(AuthorizationEnum);

export function getAuthorizationStatusName(val: AuthorizationEnum): string {
	for (const [key, value] of Object.entries(AuthorizationEnum)) {
		if (value === val) {
			return key;
		}
	}
	return `invalid authorization status value: '${val}'`;
}