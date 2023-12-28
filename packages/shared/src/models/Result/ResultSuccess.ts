import { z } from "zod";

export const resultSuccessSchema = <T extends z.ZodTypeAny>(data: T) => z.object({
	success: z.literal(true),
	data,
	ts: z.number().int(),
});

export type ResultSuccess<T> = {
	success: true,
	data: T,
	ts: number,
};

