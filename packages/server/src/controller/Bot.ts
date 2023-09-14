import { FastifyInstance } from "fastify";
import { Bot } from "src/Bot";
import { SettingsService } from "src/services/SettingsService";

export class BotController {
	private botInstance: Bot | undefined;
	constructor(
		private readonly settingsService: SettingsService,
		private readonly app: FastifyInstance
	) {
		settingsService.subscribe(async ({ botToken }, old) => {
			if (!botToken) {
				return;
			}

			const bot = new Bot(botToken);
			app.register(notify, { bot });

			await bot.init();
			app.route({
				method: 'POST',
				url: `/bot*`,
				handler: async (req) => { bot.processUpdate(req.body as Update) },
			});
			app.log.info("Bot initialized");
		}, [ "botToken" ]);
	}

	private botRoute(botToken: string): string {
		return `/bot${botToken}`;
	}
}