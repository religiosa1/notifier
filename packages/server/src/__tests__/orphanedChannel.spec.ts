import {describe, test, expect } from "vitest";
import { di } from "src/injection";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";

describe("orphaned channels removal", () => {
	async function countUserChannels(userId: number = 1) {
		const utcRepo = di.inject("UserToChannelRelationsRepository");
		const { count } = await utcRepo.listUserChannels(userId);
		return count;
	}

	test("all linking groups removed -- channel removed", withIsolatedAppEnv(async () => {
		const groupsRepo = di.inject("GroupsRepository");
		expect(await countUserChannels()).toBe(1);
		await groupsRepo.deleteGroups([1]);
		expect(await countUserChannels()).toBe(0);
	}, { omitAuth: true }));

	test("user removed from all linking groups -- channel removed", withIsolatedAppEnv(async () => {
		const utgRepo = di.inject("UserToGroupRelationsRepository");
		expect(await countUserChannels()).toBe(1);
		await utgRepo.deleteGroupFromUser(1, 1);
		expect(await countUserChannels()).toBe(0);
	}, { omitAuth: true }));

	test("some linking groups left -- channel kept", withIsolatedAppEnv(async () => {
		const groupsRepo = di.inject("GroupsRepository");
		const ctgRepo = di.inject("ChannelToGroupRelationsRepository");
		const utgRepo = di.inject("UserToGroupRelationsRepository");
			
		expect(await countUserChannels()).toBe(1);
		const [, created] = await utgRepo.connectGroupToUser(1, "test");
		expect(created).toBe(true);
		await ctgRepo.connectOrCreateGroupToChannel(1, "test");
		await groupsRepo.deleteGroups([1]);
		expect(await countUserChannels()).toBe(1);
	}, { omitAuth: true }));

	test("user removed from some of linking groups -- channel kept", withIsolatedAppEnv(async () => {
		const ctgRepo = di.inject("ChannelToGroupRelationsRepository");
		const utgRepo = di.inject("UserToGroupRelationsRepository");
			
		expect(await countUserChannels()).toBe(1);

		await utgRepo.connectGroupToUser(1, "test");
		await ctgRepo.connectOrCreateGroupToChannel(1, "test");
		await utgRepo.deleteGroupFromUser(1, 1);
		
		expect(await countUserChannels()).toBe(1);
	}, { omitAuth: true }));
});
