import { db } from "src/db";
import { createUser } from "src/services/UserService";
import * as ApiKeyService from "src/services/ApiKey";
import * as UserChannelsService from "src/services/UserChannels";
import { BotCommand } from "./BotCommand";
import { getChannelId } from "src/services/ChannelService";

/** Available bot commands */
export const botCommands: BotCommand[] = [
	new BotCommand(
		"start",
		"",
		async ({ logger, reply, userId, msg }) => {
			if (!isNaN(userId)) {
				await reply("You've already started using the bot.");
				return;
			}
			if (!msg.from) {
				throw new Error("There's no 'chat' information in the message, unable to process");
			}
			logger.info({ event: "start command", chat: msg.chat }),
			await createUser(db, {
				name: msg.chat.username,
				telegramId: msg.chat.id,
			});
			await reply(
				"Thank you, you'll be able to use the service, once an admin will approve your join request."
			);
		},
		[],
		{ hidden: true, noAuth: true }
	),
	// ---------------------------------------------------------------------------
	// Channels
	new BotCommand(
		"list_channels",
		"List all notification channels available to you",
		async ({ reply, userId }) => {
			const channels = await UserChannelsService.allAvailableChannels(db, userId);
			console.log("channels", channels);
			await reply(listMessage(
				"Available channels",
				channels.map(i => `${i.subscribed ? "[+]" : "[–]"} ${i.name}`),
				"No channels available for you. Contact admin to add you to some groups"
			));
		}
	),
	new BotCommand(
		"list_subscriptions",
		"List your current subscriptions",
		async ({ reply, userId }) => {
			const [channels] = await UserChannelsService.getUserChannels(db, userId);
			await reply(listMessage(
				"You're currently subscribed to following notification channels:",
				channels.map(i => i.name),
				"You're not currently subscribed to any channels.\n" +
				"Use /list_all_channels to see channels available to you and /join_channel to subscribe"
			));
		}
	),
	new BotCommand(
		"join_channel",
		"Join a notification channel (subscribe)",
		async ({ reply, userId }, [channel]) => {
			const channelId = await getChannelId(db, channel!);
			if (channelId == null) {
				await reply("No such channel");
				return;
			}
			await UserChannelsService.connectUserChannel(db, userId, channelId);
			await reply("Successfully joined the channel: " + channel);
		},
		["CHANNEL"],
	),
	new BotCommand(
		"leave_channel",
		"Leave a notification channel",
		async ({ reply, userId }, [channel]) => {
			const channelId = await getChannelId(db, channel!);
			if (channelId == null) {
				await reply("No such channel");
				return;
			}
			await UserChannelsService.disconnectUserChannels(db, userId, [channelId]);
			await reply("Successfully left the channel: " + channel);
		},
		["CHANNEL"],
	),
	// ---------------------------------------------------------------------------
	// Keys
	new BotCommand(
		"list_keys",
		"List your API keys to the bot",
		async ({ reply, userId }) => {
			const [apiKeys] = await ApiKeyService.getKeys(db, userId, { skip: 0, take: 999 });
			await reply(listMessage(
				"Available keys:",
				apiKeys.map(i => i.prefix),
				"No keys available. You can create a new key using /new_key command."
			));
		}
	),
	new BotCommand(
		"new_key",
		"Generate a new API key",
		async ({ reply, userId }) => {
			const apiKey = await ApiKeyService.createKey(db, userId);
			await reply("Your newly generated API key:\n" + apiKey);
		}
	),
	new BotCommand(
		"remove_key",
		"remove an API key",
		async ({ reply, userId }, [prefix]) => {
			await ApiKeyService.deleteKey(db, userId, prefix!);
			await reply("Successfully removed the key.");
		},
		["KEY"],
	),
	// ---------------------------------------------------------------------------
	// Help
	new BotCommand(
		"help",
		"List available commands",
		async ({ reply }) => {
			reply(
				botCommands.filter(cmd => !cmd.hidden).map(
					cmd => cmd.usageString + " - " + cmd.description
				).join("\n")
			);
		},
		[],
		{ noAuth: true }
	),
];

function listMessage(prefix: string, items: string[], elseMsg: string): string {
	if (!items.length) {
		return elseMsg;
	}
	return prefix + "\n" + items.map(i => "- " + i).join("\n");
}