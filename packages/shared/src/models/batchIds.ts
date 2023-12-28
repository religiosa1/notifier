import z from "zod";

export const batchIdsSchema = z.string().regex(/^\d+(?:,\d+)*$/)

export function parseIds(batchIds: string): number[] {
	return batchIds.split(",").filter(Boolean).map(Number);
}