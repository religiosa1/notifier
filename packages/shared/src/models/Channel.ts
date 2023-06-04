import z from "zod";
import { groupSchema } from "./Group";

export const channelNameSchema = z.string().min(1).regex(/[a-zA-Z]\w*/);

export const channelSchema = z.object({
  id: z.number().int().gt(0),
  name: channelNameSchema
});
export type Channel = z.infer<typeof channelSchema>;

export const channelDetailSchema = channelSchema.extend({
  Groups: z.array(groupSchema)
});
export type ChannelDetail = z.infer<typeof channelDetailSchema>;

export const channelCreateSchema = channelSchema.omit({
  id: true,
});
export const channelUpdateSchema = channelCreateSchema;