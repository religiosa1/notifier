import z from "zod";

export const tokenPayloadSchema = z.object({
  name: z.string().min(1),
  id: z.number().int(),
})
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;