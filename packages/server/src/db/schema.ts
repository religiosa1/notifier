import { relations, sql } from "drizzle-orm"
import {
	sqliteTable,
	text,
	integer,
	primaryKey,
	unique,
	index
} from "drizzle-orm/sqlite-core";

// FIXME @shared imports in drizzle
import { AuthorizationEnum } from "../../../shared/src/models/AuthorizationEnum"
import { UserRoleEnum } from "../../../shared/src/models/UserRoleEnum";

export const users = sqliteTable("users", {
	id: integer("id").primaryKey(),
	telegramId: integer("telegram_id").notNull().unique(),
	name: text("name"),
	/** only admin users can have password, so if the password exists it"s an admin	*/
	password: text("password"),
	authorizationStatus: integer("authorization_status").$type<AuthorizationEnum>().notNull().default(AuthorizationEnum.pending),
	role: integer("role").$type<UserRoleEnum>().notNull().default(UserRoleEnum.regular),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`strftime('%s', 'now')`)
    .notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`strftime('%s', 'now')`)
		.notNull(),
}, (t) => ({
	userNameIdx: index("user_name_idx").on(t.name),
}));
export const userRelations = relations(users, ({ many	}) => ({
	groups: many(usersToGroups),
	channels: many(usersToChannels),
	apiKeys: many(apiKeys),
}));

/*============================================================================*/
/* Groups */

export const groups = sqliteTable("groups", {
	id: integer("id").primaryKey(),
	name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});
export const groupsRelations = relations(groups, ({ many }) => ({
	users: many(usersToGroups),
	channels: many(channelsToGroups),
}));

export const usersToGroups = sqliteTable("users_to_groups", {
	groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade", onUpdate: "cascade" }),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	pk: primaryKey({ columns: [ t.userId, t.groupId] }),
	userToGroupUserIdIdx: index('user_to_groups_userid_idx').on(t.userId),
}));
export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
	group: one(groups, {
		fields: [usersToGroups.groupId],
		references: [groups.id],
	}),
	user: one(users, {
		fields: [usersToGroups.userId],
		references: [users.id],
	}),
}));

/*============================================================================*/
/* Channels */

export const channels = sqliteTable("channels", {
	id: integer("id").primaryKey(),
	name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});
export const channelRelations = relations(channels, ({ many }) => ({
	groups: many(channelsToGroups),
	users: many(usersToChannels),
}));

export const channelsToGroups = sqliteTable("channels_to_groups", {
	channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade", onUpdate: "cascade" }),
	groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	pk: primaryKey({ columns: [t.channelId, t.groupId ] }),
	channelsToGroupGroupIdIdx: index("channels_to_group_groupid_idx").on(t.groupId)
}));
export const channelsToGroupsRelations = relations(channelsToGroups, ({ one }) => ({
	channel: one(channels, {
		fields: [channelsToGroups.channelId],
		references: [channels.id],
	}),
	group: one(groups, {
		fields: [channelsToGroups.groupId],
		references: [groups.id],
	}),
}));

export const usersToChannels = sqliteTable("users_to_channels", {
	// with a separate primary key, to make our queries easier
	id: integer("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
	channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	uniq: unique().on(t.channelId, t.userId),
	channelIdIdx: index("user_to_channels_userId_idx").on(t.userId),
}));
export const usersToChannelsRelations = relations(usersToChannels, ({ one }) => ({
	user: one(users, {
		fields: [usersToChannels.userId],
		references: [users.id],
	}),
	channel: one(channels, {
		fields: [usersToChannels.channelId],
		references: [channels.id],
	}),
}));

/*============================================================================*/
/* API keys */

export const apiKeys = sqliteTable("api_keys", {
	/** Public part, displayed in user interface */
	prefix: text("prefix").primaryKey(),
	// Actual key part, stored as hash
	hash: text("hash").notNull(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull()
});
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users),
}));
