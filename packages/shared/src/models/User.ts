import z from "zod";
import { AuthorizationEnum } from "./AuthorizationEnum";
import { UserRoleEnum } from "./UserRoleEnum";
import { groupNameSchema } from "./Group";

export const passwordSchema = z.string().min(6).nullable()

export const userSchema = z.object({
	id: z.number().int().gt(0),
	telegramId: z.string().min(1),
	name: z.string().min(1).nullable(),
	password: passwordSchema,
	authorizationStatus: z.nativeEnum(AuthorizationEnum),
	role: z.nativeEnum(UserRoleEnum),
});
export type User = z.infer<typeof userSchema>;

export const userWithGroupsSchema = userSchema.extend({
	groups: z.array(
		z.object({
			id: z.number().int().gt(0),
			name: z.string().min(1)
		})
	)
});
export type UserWithGroups = z.infer<typeof userWithGroupsSchema>;

export const userDetailSchema = userWithGroupsSchema;
export type UserDetail = z.infer<typeof userDetailSchema>;

export const userCreateSchema = userSchema.omit({ id: true }).extend({
	groups: z.array(groupNameSchema).optional(),
	channels: z.array(z.number().int().gt(0)).optional()
});
export type UserCreate = z.infer<typeof userCreateSchema>;
export const userUpdateSchema = userCreateSchema.partial();
