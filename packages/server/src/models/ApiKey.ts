import z from 'zod';
/** 5 bytes of rfc4648 base32, followed by a separator '.' and 30 bytes of base64 */
export const apiKeySchema = z.string().regex(/[A-Z2-7/]{8}\.[A-Za-z0-9+/]{40}/);