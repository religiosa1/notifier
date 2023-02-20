import z from "zod";

export const groupSchema = z.object({
  id: z.number().int().min(1),
  name: z.string().min(1),
});
export type Group = z.infer<typeof groupSchema>;

export const groupCreateSchema = groupSchema.omit({
  id: true,
});
export const groupUpdateSchema = groupCreateSchema;