import z from "zod";

export const paginationSchema = z.object({
  skip: z.number().int().gte(0).default(0),
  take: z.number().int().gte(1).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
export const paginationDefaults = {
  skip: 0,
  take: 20
} as const;