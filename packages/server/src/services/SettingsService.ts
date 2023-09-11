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
	private emitter = new Emitter<{ change(config: ServerConfig): unknown }>();

	async loadConfig(storagePath: string): Promise<ServerConfig> {
		const currentConfigName = join(storagePath, this.currentConfigName);
		const initialConfigName = join(storagePath, this.initialConfigName);

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
		this.config = config;
	}

	subscribe(cb: (config: ServerConfig) => unknown): () => void {
		return this.emitter.on("change", cb);
	}
	unsubscribeAll(): void {
		this.emitter.clear();
	}
}

function isReadable(filename: string): Promise<boolean> {
	return access(filename, constants.F_OK | constants.R_OK)
		.then(() => true, () => false);
}