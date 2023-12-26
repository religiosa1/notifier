import {
	pgTable,
	text,
	integer,
	primaryKey,
	timestamp,
	pgEnum,
	unique,
	serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm"

// FIXME @shared imports in drizzle
import { AuthorizationEnum, authorizationEnumSchema } from "../../../shared/src/models/AuthorizationEnum"
import { UserRoleEnum, userRoleEnumSchema } from "../../../shared/src/models/UserRoleEnum";

const authorizationEnum = pgEnum("authorization_enum", authorizationEnumSchema.options);
const userRoleEnum = pgEnum("user_role_enum", userRoleEnumSchema.options);

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
  telegramId: integer("telegram_id").notNull().unique(),
  name: text("name"),
  /** only admin users can have password, so if the password exists it"s an admin  */
  password: text("password"),
  authorizationStatus: authorizationEnum("authorization_status").notNull().default(AuthorizationEnum.pending),
  role: userRoleEnum("role").notNull().default(UserRoleEnum.regular),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
export const userRelations = relations(users, ({ many  }) => ({
	groups: many(usersToGroups),
	channels: many(usersToChannels),
	apiKeys: many(apiKeys),
}));

/*============================================================================*/
/* Groups */

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const groupsRelations = relations(groups, ({ many }) => ({
	users: many(usersToGroups),
	channels: many(channelsToGroups),
}));

export const usersToGroups = pgTable("users_to_groups", {
	groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade", onUpdate: "cascade" }),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	pk: primaryKey(t.userId, t.groupId),
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

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const channelRelations = relations(channels, ({ many }) => ({
	groups: many(channelsToGroups),
	users: many(usersToChannels),
}));

export const channelsToGroups = pgTable("channels_to_groups", {
	channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade", onUpdate: "cascade" }),
	groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	pk: primaryKey(t.channelId, t.groupId),
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

export const usersToChannels = pgTable("users_to_channels", {
	// with a separate primary key, to make our queries easier
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
	channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, (t) => ({
	uniq: unique().on(t.channelId, t.userId),
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

export const apiKeys = pgTable("api_keys", {
  /** Public part, displayed in user interface */
	prefix: text("prefix").primaryKey(),
  // Actual key part, stored as hash
  hash: text("hash").notNull(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users),
}));
