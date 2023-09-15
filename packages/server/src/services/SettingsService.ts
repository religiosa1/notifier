import { join } from "path";
import { writeFile, readFile, access, constants } from "fs/promises";
import { stripComments } from "jsonc-parser";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { Emitter } from "src/util/Emitter";
import { Lock } from "src/util/Lock";
import { watchFile } from 'node:fs';
import { inject } from "src/injection";
import { getRootDir } from "src/util/getRootDir";

type MaybePromise<T> = Promise<T> | T;
type Disposer = () => MaybePromise<void>;

export class SettingsService {
	private emitter = new Emitter<{ change(config?: ServerConfig, oldConfig?: ServerConfig): unknown }>();
	private disposerLock = new Lock();

	#config: ServerConfig | undefined;
	private get config() {
		return this.#config;
	}
	private set config(value: ServerConfig | undefined) {
		const oldConfig = this.#config;
		this.#config = value;
		this.emitter.emit("change", value, oldConfig);
	}

	constructor(
		private readonly currentConfigName = "config.current.json",
		private readonly initialConfigName = "config.json",
		private readonly storagePath: string = getRootDir()
	) {
		const watchHandler = () => {
			const log = inject("logger");
			log.warn("Settings file was changed");
			this.loadConfig().catch((e) => {
				log.warn("Unable to load settings file", e);
				this.config = undefined;
			})
		};
		watchFile(join(this.storagePath, this.initialConfigName), watchHandler);
		watchFile(join(this.storagePath, this.currentConfigName), watchHandler);
	}

	async loadConfig(): Promise<ServerConfig | undefined> {
		const currentConfigName = join(this.storagePath, this.currentConfigName);
		const initialConfigName = join(this.storagePath, this.initialConfigName);

		const [ hasCurrentConfig, hasInitialConfig ] = await Promise.all([
			isReadable(currentConfigName),
			isReadable(initialConfigName),
		]);
		if (!hasCurrentConfig && !hasInitialConfig) {
			return this.config = undefined;
		}
		const fileToGet = hasCurrentConfig ? currentConfigName : initialConfigName;

		const dataString = await readFile(fileToGet, "utf8");
		const data = JSON.parse(stripComments(dataString, " "));
		if (!serverConfigSchema.safeParse(data).success) {
			return this.config = undefined;
		}
		return this.config = data;;
	}

	getConfig(): ServerConfig | undefined {
		return this.config;
	}

	async setConfig(config: ServerConfig): Promise<void> {
		let storedConfig: ServerConfig | undefined;
		try {
			serverConfigSchema.parse(config);
			await this.disposerLock.wait();
			await writeFile(
				join(this.storagePath, this.currentConfigName),
				JSON.stringify(config, undefined, 4),
				"utf8"
			);
			storedConfig = config
		} finally {
			this.config = storedConfig;
		}
	}

	subscribe(
		cb: (config?: ServerConfig, oldConfig?: ServerConfig) => MaybePromise<Disposer | void>,
		fields?: Array<keyof ServerConfig>
	): () => void {
		let disposer: Disposer | void;
		return this.emitter.on("change", async (config, oldConfig) => {
			if (typeof disposer === "function") {
				const unlock = this.disposerLock.lock();
				try {
					// we're waiting for an old disposer to finish prior to launching the new handler
					await disposer();
				} finally {
					unlock();
				}
			}
			const shouldCall = fields?.some((field) => config?.[field] !== oldConfig?.[field]) ?? true;
			disposer = shouldCall ? await cb(config, oldConfig) : undefined;
		});
	}
	unsubscribeAll(): void {
		this.emitter.clear();
	}
}

function isReadable(filename: string): Promise<boolean> {
	return access(filename, constants.F_OK | constants.R_OK)
		.then(() => true, () => false);
}