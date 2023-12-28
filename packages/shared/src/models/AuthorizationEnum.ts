import z from "zod";

export const authorizationEnumSchema = z.enum(["pending", "accepted", "declined"]);
export const AuthorizationEnum = authorizationEnumSchema.Enum;
export type AuthorizationEnum = z.infer<typeof authorizationEnumSchema>;

export function getAuthorizationStatusName(val: AuthorizationEnum): string {
	if (authorizationEnumSchema.options.includes(val)){
		return val;
	}
	return `invalid authorization status value: '${val}'`;
}