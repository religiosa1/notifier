import z from 'zod';
export const counted = <T extends z.ZodTypeAny>(data: T) => z.object({
  count: z.number().gte(0).int(),
  data,
});