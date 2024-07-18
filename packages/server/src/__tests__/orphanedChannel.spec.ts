import {describe, test, expect } from "vitest";
import { di } from "src/injection";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { isUniqueConstraintError } from "src/db";

describe("orphaned channels removal", () => {
	async function countUserChannels(userId: number = 1) {
		const utcRepo = di.inject("UserToChannelRelationsRepository");
		const { count } = await utcRepo.listUserChannels(userId);
		return count;
	}

	async function connectChannelThroughGroup(channelName: string, groupName = "default", userId = 1) {
		const utgRepo = di.inject("UserToGroupRelationsRepository");
		const utcRepo = di.inject("UserToChannelRelationsRepository");
		const ctgRepo = di.inject("ChannelToGroupRelationsRepository");
		const [groupId] = await utgRepo.connectGroupToUser(userId, groupName);

		const [channelId] = await ctgRepo.connectOrCreateChannelToGroup(groupId, channelName);
		await utcRepo.connectUserChannel(userId, channelId).catch(e => {
			if (!isUniqueConstraintError(e)) {
				throw e;
			}
		})
	}

	test("all linking groups removed -- channel removed", withIsolatedAppEnv(async () => {
		const groupsRepo = di.inject("GroupsRepository");
		await connectChannelThroughGroup("extra", "extra");
		expect(await countUserChannels()).toBe(2);

		await groupsRepo.deleteGroups([1]);
		expect(await countUserChannels()).toBe(1); // extra group is left
	}, { omitAuth: true }));

	test("user removed from all linking groups -- channel removed", withIsolatedAppEnv(async () => {
		const utgRepo = di.inject("UserToGroupRelationsRepository");
		await connectChannelThroughGroup("extra", "extra");
		expect(await countUserChannels()).toBe(2);

		await utgRepo.deleteGroupFromUser(1, 1);
		expect(await countUserChannels()).toBe(1);
	}, { omitAuth: true }));

	test("some linking groups left -- channel kept", withIsolatedAppEnv(async () => {
		const groupsRepo = di.inject("GroupsRepository");
		await connectChannelThroughGroup("default", "extra");
		expect(await countUserChannels()).toBe(1);

		await groupsRepo.deleteGroups([1]);
		expect(await countUserChannels()).toBe(1);
	}, { omitAuth: true }));

	test("user removed from some of linking groups -- channel kept", withIsolatedAppEnv(async () => {
		const utgRepo = di.inject("UserToGroupRelationsRepository");
		await connectChannelThroughGroup("default", "extra");
		expect(await countUserChannels()).toBe(1);
	
		await utgRepo.deleteGroupFromUser(1, 1);
		expect(await countUserChannels()).toBe(1);
	}, { omitAuth: true }));
});
