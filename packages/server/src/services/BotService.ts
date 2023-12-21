import { Bot } from "src/Bot";
import type { IBot } from "src/Bot/Models";
import { inject } from "src/injection";

export class BotService {
	#instanceData?: { bot: IBot, botToken: string };
	get instance() {
		return this.#instanceData?.bot;
	}
	getInstanceAndToken() {
		return {...this.#instanceData };
	}

	constructor(
		settingsService = inject("SettingsService"),
		logger = inject("logger"),
		appListenService = inject("AppListenService"),
	) {
		settingsService.subscribe(async (settings) => {
			const { botToken, publicUrl } = settings || {};
			if (!botToken || !publicUrl) {
				this.#instanceData = undefined;
				logger.warn("Bot token or publicUrl is missing in the settings, bot is NOT initialized");
				return;
			}
		
			logger.info("Initializing the bot");
			const bot = new Bot(botToken);
		
			await bot.init();
			this.#instanceData = { bot, botToken };
		
			logger.info("Bot initialized");
			await appListenService.listening();
			logger.info(`Setting webhook on ${publicUrl}/bot${botToken}`);
			const  d = await bot.setWebHook(`${publicUrl}/bot${botToken}`);
			logger.info("Webhook is set", d);
			return () => bot.destroy();
		}, [ "botToken", "publicUrl" ]);
	}
}

