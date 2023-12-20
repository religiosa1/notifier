import { intGt, toInt } from "../helpers/zodHelpers";
import z from "zod";

export const pageinationQuerySchema = z.object({
  skip: z.string().default("0").refine(...intGt(0)).transform(toInt),
  take: z.string().default("20").refine(...intGt(1)).transform(toInt)
});

export const paginationSchema = z.object({
  skip: z.number({ coerce: true }).int().gte(0).default(0),
  take: z.number({ coerce: true }).int().gte(1).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const paginationDefaults = {
  skip: 0,
  take: 20
} as const;