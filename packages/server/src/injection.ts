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


type ContainerInit<T> = {
	[K in keyof T]: () => T[K];
}

class DiContainer<T extends Record<string, {}>> {
	private readonly container: Partial<T> = {};
	constructor(private readonly containerInit: ContainerInit<T>) {
    this.inject = this.inject.bind(this);
		
	}

	inject<TItem extends keyof T & string>(key: TItem): T[TItem] {
		if (!(key in this.containerInit)) {
			throw new Error(`Incorrect injection key during inject: '${key}'`);
		}
		this.container[key] ??= this.containerInit[key]();
		return this.container[key] as T[TItem] ;
	}
}

export const di = new DiContainer({
	AppListenService: () => new AppListenService(),
	logger: () => pino({ level: 'info' }) as BaseLogger,
	SettingsService: () => new SettingsService(),
	db: () => new DatabaseConnectionManager(),
	GroupsRepository: () => new GroupsRepository(),
	UsersRepository: () => new UsersRepository(),
	UserConfirmationRequestsRepository: () => new UserConfirmationRequestsRepository(),
	UserToGroupRelationsRepository: () => new UserToGroupRelationsRepository(),
	ApiKeysRepository: () => new ApiKeysRepository(),
	ChannelsRepository: () => new ChannelsRepository(),
	ChannelToGroupRelationsRepository: () => new ChannelToGroupRelationsRepository(),
	UserToChannelRelationsRepository: () => new UserToChannelRelationsRepository(),
	Bot: () => new BotService(),
});

