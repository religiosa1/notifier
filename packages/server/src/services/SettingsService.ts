import { join } from "path";
import { writeFile, readFile, access, constants, unlink } from "fs/promises";
import { stripComments } from "jsonc-parser";

import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { ResultError } from "@shared/models/Result";

import { di } from "src/injection";
import { Emitter } from "src/util/Emitter";
import { Lock } from "src/util/Lock";
import { getRootDir } from "src/util/getRootDir";
import { DatabaseConnectionTester } from "src/db/DatabaseConnectionTester";


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
		private readonly logger = di.inject("logger"),
		private readonly dbConnectionTester = new DatabaseConnectionTester(),
		private readonly settingsFileName = process.env.NOTIFIER_SETTINGS_FILENAME || join(getRootDir(), "config.json"),
	) {}

	dispose() {
		this.unsubscribeAll();
	}
	[Symbol.dispose]() {
		this.dispose();
	}

	async loadConfig(): Promise<ServerConfig | undefined> {
		if (!await this.isConfigFileReadable()) {
			return;
		}

		const dataString = await readFile(this.settingsFileName, "utf8");
		const data = JSON.parse(stripComments(dataString, " "));
		if (!serverConfigSchema.safeParse(data).success) {
			return this.config = undefined;
		}
		return this.config = data;
	}

	getConfig(): ServerConfig | undefined {
		return this.config;
	}

	async setConfig(config: ServerConfig): Promise<void> {
		let storedConfig: ServerConfig | undefined;
		serverConfigSchema.parse(config);
		const isDbOk = await this.dbConnectionTester.checkConnectionString(config.databaseUrl);
		if (!isDbOk) {
			throw new ResultError(422, "Cannot connect to the DB with the provided 'databaseUrl' string");
		}
		try {
			await this.disposerLock.wait();
			const output = JSON.stringify(config, undefined, 4);
			await writeFile(this.settingsFileName, output, "utf8");
			storedConfig = config
		} finally {
			this.config = storedConfig;
		}
	}

	testConfigsDatabaseConnection(connectionString: string): Promise<boolean> {
		return this.dbConnectionTester.checkConnectionString(connectionString);
	}

	async removeConfig(): Promise<void> {
		await unlink(this.settingsFileName);
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

	private isConfigFileReadable(): Promise<boolean> {
		return access(this.settingsFileName, constants.R_OK).then(() => true, () => false);
	}
}