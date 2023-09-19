import { AppListenService } from "src/services/AppListenService";
import { SettingsService } from "src/services/SettingsService";
import pino, { BaseLogger } from "pino";
import { IBot } from "src/Bot/Models";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";

export const container = {
	SettingsService: undefined as unknown as SettingsService,
	AppListenService: new AppListenService(),
	logger: pino({ level: 'info' }) as BaseLogger,
	Bot: undefined as IBot | undefined,
	db: undefined as unknown as DatabaseConnectionManager,
};
type Container = typeof container;

container.SettingsService = new SettingsService();
container.db = new DatabaseConnectionManager();

export function inject<TItem extends keyof Container>(key: TItem): Container[TItem] {
	if (!(key in container)) {
		throw new Error("Incorrect injection key");
	}
	return container[key];
}

export function register<TItem extends keyof Container>(
	key: TItem,
	item: Container[TItem],
): void {
	if (!(key in container)) {
		throw new Error("Incorrect injection key");
	}
	container[key] = item;
}