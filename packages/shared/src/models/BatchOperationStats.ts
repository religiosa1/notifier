import z from "zod";

export const batchOperationStatsSchema = z.object({
  count: z.number(),
  outOf: z.number(),
});
export type BatchOperationStats = z.infer<typeof batchOperationStatsSchema>;