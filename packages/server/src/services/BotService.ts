import { Bot } from "src/Bot";
import type { IBot } from "src/Bot/Models";
import { di } from "src/injection";
import { urlJoin } from "@shared/helpers/urlJoin";

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
			try {
				await bot.init();
				logger.info("Bot initialized.");

				logger.info("Waiting for app to start listening to initialize webhook...");
				await appListenService.listening();
				
				const webHookAddress = urlJoin(publicUrl, "bot", botToken);

				logger.info("Setting webhook on %s", webHookAddress);
				const  d = await bot.setWebHook(webHookAddress);
				logger.info("Webhook is set", d);
				this.#instanceData = { bot, botToken };
				return () => bot.destroy();
			} catch(e) {
				bot.destroy();
				return;
			}
		}, [ "botToken", "publicUrl" ]);
	}
}

