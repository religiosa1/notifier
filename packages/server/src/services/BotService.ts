import { Bot } from "src/Bot";
import type { IBot } from "src/Bot/Models";
import { di } from "src/injection";

export class BotService {
	#instanceData?: { bot: IBot, botToken: string };
	get instance() {
		return this.#instanceData?.bot;
	}
	getInstanceAndToken() {
		return {...this.#instanceData };
	}

	constructor(
		settingsService = di.inject("SettingsService"),
		logger = di.inject("logger"),
		appListenService = di.inject("AppListenService"),
	) {
		settingsService.subscribe(async (settings) => {
			const { botToken, publicUrl } = settings || {};
			logger.info("Initializing the bot");
			if (!botToken || !publicUrl) {
				this.#instanceData = undefined;
				logger.warn("Bot token or publicUrl is missing in the settings, bot is NOT initialized");
				return;
			}
		
			const bot = new Bot(botToken);
			await bot.init();			
			this.#instanceData = { bot, botToken };
			logger.info("Bot initialized.");

			logger.info("Waiting for app to start listening to initialize webhook...");
			await appListenService.listening();
			logger.info(`Setting webhook on ${publicUrl}/bot${botToken}`);
			const  d = await bot.setWebHook(`${publicUrl}/bot${botToken}`);
			logger.info("Webhook is set", d);
			return () => bot.destroy();
		}, [ "botToken", "publicUrl" ]);
	}
}

