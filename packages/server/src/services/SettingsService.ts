import { join } from "path";
import { writeFile, readFile, access, constants } from "fs/promises";
import { stripComments } from "jsonc-parser";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { Emitter } from "src/util/Emitter";
import { Lock } from "src/util/Lock";
import { watchFile } from 'node:fs';
import { di } from "src/injection";

import { getRootDir } from "src/util/getRootDir";
import { DatabaseConfigurator } from "src/db/DatabaseConnectionTester";
import { ResultError } from "@shared/models/Result";

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
		private readonly initialConfigName = "config.json",
		private readonly storagePath: string = getRootDir(),
		private readonly databaseConfigurator = new DatabaseConfigurator(),
	) {
		const watchHandler = () => {
			const log = di.inject("logger");
			log.warn("Settings file was changed");
			this.loadConfig().catch((e) => {
				log.warn("Unable to load settings file", e);
				this.config = undefined;
			});
		};
		watchFile(this.getConfigFileName(), watchHandler);
	}

	async loadConfig(): Promise<ServerConfig | undefined> {
		const configName = this.getConfigFileName();

		if (!await this.isConfigFileReadable()) {
			return;
		}
		const dataString = await readFile(configName, "utf8");
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
		serverConfigSchema.parse(config);
		const isDbOk = await this.databaseConfigurator.checkConnectionString(config.databaseUrl);
		if (!isDbOk) {
			throw new ResultError(400, "Cannot connect to the DB with the provided 'databaseUrl' string");
		}
		try {
			await this.disposerLock.wait();
			const output = JSON.stringify(config, undefined, 4);
			await writeFile(this.getConfigFileName(), output, "utf8");
			storedConfig = config
		} finally {
			this.config = storedConfig;
		}
	}

	testConfigsDatabaseConnection(connectionString: string): Promise<boolean> {
		return this.databaseConfigurator.checkConnectionString(connectionString);
	}

	subscribe(
		cb: (config?: ServerConfig, oldConfig?: ServerConfig) => MaybePromise<Disposer | void>,
		fields?: Array<keyof ServerConfig>
	): () => void {
		let disposer: Disposer | void;
		return this.emitter.on("change", async (config, oldConfig) => {
			if (typeof disposer === "function") {
				using _lock = this.disposerLock.lock();
				// we're waiting for an old disposer to finish prior to launching the new handler
				await disposer();
			}
			const shouldCall = fields?.some((field) => config?.[field] !== oldConfig?.[field]) ?? true;
			disposer = shouldCall ? await cb(config, oldConfig) : undefined;
		});
	}

	unsubscribeAll(): void {
		this.emitter.clear();
	}

	private getConfigFileName() {
		return join(this.storagePath, this.initialConfigName)
	}

	private isConfigFileReadable(): Promise<boolean> {
		return isReadable(this.getConfigFileName());
	}
}

function isReadable(filename: string): Promise<boolean> {
	return access(filename, constants.F_OK | constants.R_OK)
		.then(() => true, () => false);
}