import z from "zod";

export const userPreviewSchema = z.object({
	id: z.number().int().gt(0),
	name: z.optional(z.string().min(1).nullable()),
});
export type UserPreview = z.infer<typeof userPreviewSchema>;