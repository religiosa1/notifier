import pino, { type BaseLogger } from "pino";
import { AppListenService } from "src/services/AppListenService";
import { BotService } from "./services/BotService";
import { SettingsService } from "src/services/SettingsService";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";
import { GroupsRepository } from "src/repositories/GroupsRepository";
import { UserToGroupRelationsRepository } from "src/repositories/UserToGroupRelationsRepository";
import { UsersRepository } from "src/repositories/UsersRepository";
import { ApiKeysRepository } from "src/repositories/ApiKeysRepository";
import { ChannelsRepository } from "src/repositories/ChannelsRepository";
import { ChannelToGroupRelationsRepository } from "src/repositories/ChannelToGroupRelationsRepository";
import { UserConfirmationRequestsRepository } from "src/repositories/UserConfirmationRequestsRepository";
import { UserToChannelRelationsRepository } from "src/repositories/UserToChannelRelationsRepository";
import { DatabaseMigrator } from "./db/DatabaseMigrator";
import { DiContainer } from "src/util/DiContainer";

export const di = new DiContainer({
	AppListenService: () => new AppListenService(),
	logger: () => pino({ level: process.env.NOTIFIER_LOG_LEVEL || 'info' }) as BaseLogger,
	SettingsService: () => new SettingsService(),
	db: () => new DatabaseConnectionManager(),
	DatabaseMigrator: () => new DatabaseMigrator(),
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
