#!/usr/bin/env tsx
import "../src/polyfill";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AuthorizationEnum } from "@shared/models/AuthorizationEnum"
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { hash } from "src/Authorization/hash";

import * as schema from "src/db/schema";
import { databaseUrl } from "../config.json";

async function main() {
	if (!databaseUrl) {
		throw new Error("No database url is present");
	}

	console.log("Connecting...");
	const db = drizzle(postgres(databaseUrl, { max: 1}), { schema });
	console.log("creating groups...");
	await db.insert(schema.groups)
		.values({ id: 1, name: "default" })
		.onConflictDoNothing();
	console.log("Creating channels...");
  await db.insert(schema.channels)
		.values({ id: 1, name: "default"})
		.onConflictDoNothing();
	console.log("Creating channelsToGroups relations...");
	await db.insert(schema.channelsToGroups)
		.values({ channelId: 1, groupId: 1})
		.onConflictDoNothing();
	console.log("Creating users...");
	await db.insert(schema.users)
		.values({
			id: 1,
			telegramId: Number(process.env.ROOT_TELEGRAM_ID) || 1234567,
			name: 'admin',
			password: await hash(process.env["NOTIFIER_ADMIN_PWD"] || "1234567"),
			authorizationStatus: AuthorizationEnum.accepted,
			role: UserRoleEnum.admin,
		})
		.onConflictDoNothing();
	console.log("Creating usersToGroups relations...");
	await db.insert(schema.usersToGroups)
		.values({ userId: 1, groupId: 1 })
		.onConflictDoNothing();
	console.log("Creating usersToChannels relations...");
	await db.insert(schema.usersToChannels)
		.values({ userId: 1, channelId: 1 })
		.onConflictDoNothing();
}

main()
	.then(() => {
		console.log("All's done");
		process.exit();
	})
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })