import z from "zod";

export const groupNameSchema = z.string().min(1).regex(/[a-zA-Z]\w*/)

export const groupSchema = z.object({
  id: z.number().int().min(1),
  name: groupNameSchema
});
export type Group = z.infer<typeof groupSchema>;

export const groupCreateSchema = groupSchema.omit({
  id: true,
});
export const groupUpdateSchema = groupCreateSchema;