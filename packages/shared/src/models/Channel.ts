import z from "zod";

export const channelNameSchema = z.string().min(1).regex(/[a-zA-Z]\w*/)

export const channelSchema = z.object({
  id: z.number().int().min(1),
  name: channelNameSchema
});
export type Channel = z.infer<typeof channelSchema>;

export const channelCreateSchema = channelSchema.omit({
  id: true,
});
export const channelUpdateSchema = channelCreateSchema;