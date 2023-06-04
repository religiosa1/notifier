import z from "zod";
import { userPreviewSchema } from "./UserPreview";

export const groupNameSchema = z.string().min(1).regex(/[a-zA-Z]\w*/)

export const groupSchema = z.object({
  id: z.number().int().gt(0),
  name: groupNameSchema
});
export type Group = z.infer<typeof groupSchema>;

export const groupDetailSchema = groupSchema.extend({
  Users: z.array(userPreviewSchema),
  // Not importing to avoid circular dependencies (bug in vite)
  // https://github.com/vitejs/vite/issues/2314
  Channels: z.array(z.object({
    id: z.number().int().gt(0),
    name: z.string().min(1).regex(/[a-zA-Z]\w*/),
  })),
});
export type GroupDetail = z.infer<typeof groupDetailSchema>;

export const groupCreateSchema = groupSchema.omit({
  id: true,
});
export const groupUpdateSchema = groupCreateSchema;