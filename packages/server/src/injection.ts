import { AppListenService } from "src/services/AppListenService";
import { SettingsService } from "src/services/SettingsService";
import pino, { type BaseLogger } from "pino";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";
import { GroupsRepository } from "src/repositories/GroupsRepository";
import { UserToGroupRelationsRepository } from "src/repositories/UserToGroupRelationsRepository";
import { UsersRepository } from "src/repositories/UsersRepository";
import { ApiKeysRepository } from "src/repositories/ApiKeysRepository";
import { ChannelsRepository } from "src/repositories/ChannelsRepository";
import { ChannelToGroupRelationsRepository } from "src/repositories/ChannelToGroupRelationsRepository";
import { UserConfirmationRequestsRepository } from "src/repositories/UserConfirmationRequestsRepository";
import { UserToChannelRelationsRepository } from "src/repositories/UserToChannelRelationsRepository";
import { BotService } from "./services/BotService";

export const container = {
	SettingsService: undefined as unknown as SettingsService,
	AppListenService: new AppListenService(),
	logger: pino({ level: 'info' }) as BaseLogger,
	Bot: undefined as unknown as BotService,
	db: undefined as unknown as DatabaseConnectionManager,
	GroupsRepository: undefined as unknown as GroupsRepository,
	UsersRepository: undefined as unknown as UsersRepository,
	UserConfirmationRequestsRepository: undefined as unknown as UserConfirmationRequestsRepository,
	UserToGroupRelationsRepository: undefined as unknown as UserToGroupRelationsRepository,
	ApiKeysRepository: undefined as unknown as ApiKeysRepository,
	ChannelsRepository: undefined as unknown as ChannelsRepository,
	ChannelToGroupRelationsRepository: undefined as unknown as ChannelToGroupRelationsRepository,
	UserToChannelRelationsRepository: undefined as unknown as UserToChannelRelationsRepository
};
type Container = typeof container;

container.SettingsService = new SettingsService();
container.db = new DatabaseConnectionManager();
container.GroupsRepository = new GroupsRepository();
container.UsersRepository = new UsersRepository();
container.UserConfirmationRequestsRepository = new UserConfirmationRequestsRepository();
container.UserToGroupRelationsRepository = new UserToGroupRelationsRepository();
container.ApiKeysRepository = new ApiKeysRepository();
container.ChannelsRepository = new ChannelsRepository();
container.ChannelToGroupRelationsRepository = new ChannelToGroupRelationsRepository();
container.UserToChannelRelationsRepository = new UserToChannelRelationsRepository();
container.Bot = new BotService();

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