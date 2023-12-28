import z from "zod";
import { AuthorizationEnum, authorizationEnumSchema } from "./AuthorizationEnum";
import { UserRoleEnum, userRoleEnumSchema } from "./UserRoleEnum";
import { userPreviewSchema } from "./UserPreview";
import { groupNameSchema } from "./Group";

export const passwordSchema = z.string().min(6).nullable();

export const userSchema = userPreviewSchema.extend({
	telegramId: z.number({ coerce: true }),
	password: z.optional(passwordSchema),
	authorizationStatus: authorizationEnumSchema.default(AuthorizationEnum.pending),
	role: userRoleEnumSchema.default(UserRoleEnum.regular),
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

export const userCreateSchema = userSchema.omit({ id: true }).partial({
	authorizationStatus: true,
	role: true,
}).extend({
	groups: z.array(groupNameSchema).optional(),
	channels: z.array(z.number().int().gt(0)).optional()
});
export type UserCreate = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = userCreateSchema.partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>
