import z from 'zod';
/** 5 bytes of rfc4648 base32, followed by a separator '.' and 30 bytes of base64 */
export const apiKeyRegex = /^[A-Z2-7/]{8}\.[A-Za-z0-9+/]{40}$/
export const apiKeySchema = z.string().regex(apiKeyRegex);
export const apiKeyPrefixSchema = z.string().regex(/^[A-Z2-7/]{8}$/);

export const apiKeyPreviewSchema = z.object({
	prefix: apiKeyPrefixSchema,
	createdAt: z.date(),
});
export type ApiKeyPreview = z.infer<typeof apiKeyPreviewSchema>;