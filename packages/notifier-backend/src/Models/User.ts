import z from "zod";
import { AuthorizationEnum } from "./AuthorizationEnum";

export const userSchema = z.object({
  id: z.number().int(),
  telegramId: z.string(),
  name: z.string().nullable(),
  password: z.string().nullable(),
  authorizationStatus: z.nativeEnum(AuthorizationEnum),
});

export type User = z.infer<typeof userSchema>;

export const userWithGroupSchema = userSchema.extend({
  groups: z.array(z.object({
    id: z.number().int(),
    name: z.string(),
  })),
});

export type UserWithGroups = z.infer<typeof userWithGroupSchema>;