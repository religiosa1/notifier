import { join } from "path";
import { writeFile, readFile, access, constants } from "fs/promises";
import { stripComments } from "jsonc-parser";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { Emitter } from "src/util/Emitter";

export class SettingsService {
	readonly currentConfigName = "config.current.json";
	readonly initialConfigName = "config.json";

	private config: ServerConfig | undefined;
	private storagePath: string = __dirname;
	private emitter = new Emitter<{ change(config: ServerConfig, oldConfig?: ServerConfig): unknown }>();

	async loadConfig(): Promise<ServerConfig> {
		const currentConfigName = join(this.storagePath, this.currentConfigName);
		const initialConfigName = join(this.storagePath, this.initialConfigName);

		const fileToGet = await isReadable(currentConfigName) ? currentConfigName : initialConfigName;
		const dataString = await readFile(fileToGet, "utf8");
		const data = JSON.parse(stripComments(dataString, " "));
		return serverConfigSchema.parse(data);
	}

	getConfig(): ServerConfig | undefined {
		return this.config;
	}

	async setConfig(config: ServerConfig): Promise<void> {
		serverConfigSchema.parse(config);
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
		cb: (config: ServerConfig, oldConfig?: ServerConfig) => unknown,
		fields?: Array<keyof ServerConfig>
	): () => void {
		return this.emitter.on("change", (config, oldConfig) => {
			const shouldCall = fields?.some((field) => config[field] !== oldConfig?.[field]) ?? true;
			if (shouldCall) {
				cb(config, oldConfig);
			}
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