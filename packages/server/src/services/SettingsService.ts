import { join } from "path";
import { writeFile, readFile, access, constants } from "fs/promises";
import { stripComments } from "jsonc-parser";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { Emitter } from "src/util/Emitter";
import { Lock } from "src/util/Lock";

type MaybePromise<T> = Promise<T> | T;
type Disposer = () => MaybePromise<void>;

export class SettingsService {
	readonly currentConfigName = "config.current.json";
	readonly initialConfigName = "config.json";

	private config: ServerConfig | undefined;
	private storagePath: string = __dirname;
	private emitter = new Emitter<{ change(config?: ServerConfig, oldConfig?: ServerConfig): unknown }>();
	private disposerLock = new Lock();

	async loadConfig(): Promise<ServerConfig | undefined> {
		const currentConfigName = join(this.storagePath, this.currentConfigName);
		const initialConfigName = join(this.storagePath, this.initialConfigName);

		const [ hasCurrentConfig, hasInitialConfig ] = await Promise.all([
			isReadable(initialConfigName),
			isReadable(currentConfigName),
		]);
		if (!hasCurrentConfig && !hasInitialConfig) {
			this.emitter.emit("change", undefined );
			return undefined;
		}
		const fileToGet = hasCurrentConfig ? currentConfigName : initialConfigName;

		const dataString = await readFile(fileToGet, "utf8");
		const data = JSON.parse(stripComments(dataString, " "));
		if (!serverConfigSchema.safeParse(data).success) {
			return undefined;
		}
		this.config = data;
		return data;
	}

	getConfig(): ServerConfig | undefined {
		return this.config;
	}

	async setConfig(config: ServerConfig): Promise<void> {
		serverConfigSchema.parse(config);
		await this.disposerLock.wait();
		await writeFile(
			join(this.storagePath, this.currentConfigName),
			JSON.stringify(config, undefined, 4),
			"utf8"
		);
		const oldConfig = this.config;
		this.config = config;
		this.emitter.emit("change", config, oldConfig);
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