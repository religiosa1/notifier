import { AppListenService } from "src/services/AppListenService";
import { SettingsService } from "src/services/SettingsService";
import pino, { BaseLogger } from "pino";

type Container = typeof container;
const container = {
	SettingsService: new SettingsService(),
	AppListenService: new AppListenService(),
	logger: pino({ level: 'info' }) as BaseLogger,
}

export function inject<TItem extends keyof typeof container>(key: TItem): Container[TItem] {
	if (!(key in container)) {
		throw new Error("Incorrect injection key");
	}
	return container[key];
}

export function register<TItem extends keyof typeof container>(
	key: TItem,
	item: Container[TItem],
): void {
	if (!(key in container)) {
		throw new Error("Incorrect injection key");
	}
	container[key] = item;
}