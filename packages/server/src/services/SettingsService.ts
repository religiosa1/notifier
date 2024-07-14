
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { DEFAULT_DB_NAME } from "drizzle.config";

import { di } from "src/injection";
import { Emitter } from "src/util/Emitter";
import { Lock } from "src/util/Lock";

type MaybePromise<T> = Promise<T> | T;
type Disposer = () => MaybePromise<void>;

export class SettingsService {
	private emitter = new Emitter<{ change(config?: ServerConfig, oldConfig?: ServerConfig): unknown }>();
	private disposerLock = new Lock();

	#config: Readonly<ServerConfig> | undefined;
	private get config() {
		return this.#config;
	}
	private set config(value: ServerConfig | undefined) {
		const oldConfig = this.#config;
		this.#config = value;
		this.emitter.emit("change", value, oldConfig);
	}

	constructor(
		private readonly logger = di.inject("logger"),
	) {}

	dispose() {
		this.unsubscribeAll();
	}
	[Symbol.dispose]() {
		this.dispose();
	}

	loadConfig(): ServerConfig | undefined {
		const config: ServerConfig = Object.freeze({
			botToken: process.env.BOT_TOKEN,
			jwtSecret: process.env.JWT_SECRET,
			tgHookSecret: process.env.TG_HOOK_SECRET,
			publicUrl: process.env.PUBLIC_URL ?? "",
			databaseFileName: process.env.DB_FILE ?? DEFAULT_DB_NAME,
		});
		serverConfigSchema.parse(config);
		return this.config = config;
	}

	getConfig(): Readonly<ServerConfig> | undefined {
		if (this.config == null) {
			this.loadConfig();
		}
		return this.config;
	}

	setConfig(config: ServerConfig): Readonly<ServerConfig> {
		const validatedConfig = serverConfigSchema.parse(config);
		return this.config = Object.freeze(validatedConfig);
	}

	patchConfig(config: Partial<ServerConfig>): Readonly<ServerConfig> {
		const oldConfig = this.getConfig();
		const patchedConfig: ServerConfig = {
			...oldConfig!,
			...config,
		};
		return this.setConfig(patchedConfig);
	}

	removeConfig(): void {
		this.config = undefined;
	}

	subscribe(
		cb: (config?: ServerConfig, oldConfig?: ServerConfig) => MaybePromise<Disposer | void>,
		fields?: Array<keyof ServerConfig>
	): () => void {
		let disposer: Disposer | void;
		const handler = async (config?: ServerConfig, oldConfig?: ServerConfig):  Promise<Disposer | void> => {
			try {			
				if (typeof disposer === "function") {
					using _lock = this.disposerLock.lock();
					// we"re waiting for an old disposer to finish prior to launching the new handler
					await disposer();
				}
				const shouldCall = fields?.some((field) => config?.[field] !== oldConfig?.[field]) ?? true;
				disposer = shouldCall ? await cb(config, oldConfig) : undefined;
			} catch (e) {
				this.logger.error("Error in settings onChange listener: %O", e);
			}
		}
		handler(this.#config); // Run immmediate
		return this.emitter.on("change", handler);
	}

	unsubscribeAll(): void {
		this.emitter.clear();
	}
}