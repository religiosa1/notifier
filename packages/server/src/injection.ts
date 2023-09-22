import { AppListenService } from "src/services/AppListenService";
import { SettingsService } from "src/services/SettingsService";
import pino, { BaseLogger } from "pino";
import { IBot } from "src/Bot/Models";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";
import { GroupsRepository } from "src/repositories/GroupsRepository";
import { UsersToGroupRelationRepository } from "src/repositories/UsersToGroupRelationRepository";
import { UsersRepository } from "src/repositories/UsersRepository";
import { ApiKeysRepository } from "src/repositories/ApiKeysRepository";
import { ChannelsRepository } from "src/repositories/ChannelsRepository";
import { ChannelToGroupRelationRepository } from "src/repositories/ChannelToGroupsRelationRepository";
import { UserConfirmationRequestsRepository } from "src/repositories/UserConfirmationRequestsRepository";

export const container = {
	SettingsService: undefined as unknown as SettingsService,
	AppListenService: new AppListenService(),
	logger: pino({ level: 'info' }) as BaseLogger,
	Bot: undefined as IBot | undefined,
	db: undefined as unknown as DatabaseConnectionManager,

	GroupsRepository: undefined as unknown as GroupsRepository,
	UsersRepository: undefined as unknown as UsersRepository,
	UserConfirmationRequestsRepository: undefined as unknown as UserConfirmationRequestsRepository,
	UsersToGroupRelationRepository: undefined as unknown as UsersToGroupRelationRepository,
	ApiKeysRepository: undefined as unknown as ApiKeysRepository,
	ChannelsRepository: undefined as unknown as ChannelsRepository,
	ChannelToGroupRelationRepository: undefined as unknown as ChannelToGroupRelationRepository,
};
type Container = typeof container;

container.SettingsService = new SettingsService();
container.db = new DatabaseConnectionManager();
container.GroupsRepository = new GroupsRepository();
container.UsersRepository = new UsersRepository();
container.UserConfirmationRequestsRepository = new UserConfirmationRequestsRepository();
container.UsersToGroupRelationRepository = new UsersToGroupRelationRepository();
container.ApiKeysRepository = new ApiKeysRepository();
container.ChannelsRepository = new ChannelsRepository();
container.ChannelToGroupRelationRepository = new ChannelToGroupRelationRepository();

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