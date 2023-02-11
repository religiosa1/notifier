import z from "zod";
import { AuthorizationEnum } from "./AuthorizationEnum";

export const userSchema = z.object({
  id: z.number().int().gt(0),
  telegramId: z.string().min(1),
  name: z.string().nullable(),
  password: z.string().nullable(),
  authorizationStatus: z.nativeEnum(AuthorizationEnum),
});
export type User = z.infer<typeof userSchema>;

export const userWithGroupsSchema = userSchema.extend({
  groups: z.array(z.object({
    id: z.number().int().gt(0),
    name: z.string().min(1),
  })),
});
export type UserWithGroups = z.infer<typeof userWithGroupsSchema>;

export const userDetailSchema = userWithGroupsSchema.extend({
  channels: z.array(z.object({
    id: z.number().int().gt(0),
    name: z.string().min(1),
  })),
});
export type UserDetail = z.infer<typeof userDetailSchema>;