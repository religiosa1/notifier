import { passwordSchema } from './User';
import z from 'zod';

export const botTokenRegex = /^\d{10}:[\w]{35}$/;
export const jwtSecretRegex = /^[A-Za-z0-9+/]+={0,2}$/;
/** https://core.telegram.org/bots/api#setwebhook */
export const telegramSecretRegex = /^[A-Za-z0-9_\-]+$/;

/** ServerConfiguration schema */
export const serverConfigSchema = z.object({
	botToken: z.string().min(46).regex(botTokenRegex),
	jwtSecret: z.string().min(100).regex(jwtSecretRegex),
	tgHookSecret:  z.string().min(100).regex(jwtSecretRegex),
	publicUrl: z.string().url(),
	databaseUrl: z.string().url(),
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;

/** ServerSetup request schema */
export const setupFormSchema = serverConfigSchema.extend({
	password: passwordSchema,
	telegramId: z.number().int().gt(0).optional(),
	migrate: z.boolean().optional(),
});
export type SetupForm = z.infer<typeof setupFormSchema>;