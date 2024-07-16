CREATE TABLE `api_keys` (
	`prefix` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `channels_to_groups` (
	`channel_id` integer NOT NULL,
	`group_id` integer NOT NULL,
	PRIMARY KEY(`channel_id`, `group_id`),
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`telegram_id` integer NOT NULL,
	`name` text,
	`password` text,
	`authorization_status` integer DEFAULT 0 NOT NULL,
	`role` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_to_channels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`channel_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users_to_groups` (
	`group_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channels_name_unique` ON `channels` (`name`);--> statement-breakpoint
CREATE INDEX `channels_to_group_groupid_idx` ON `channels_to_groups` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `groups_name_unique` ON `groups` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);--> statement-breakpoint
CREATE INDEX `user_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `user_to_channels_userId_idx` ON `users_to_channels` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_to_channels_channel_id_user_id_unique` ON `users_to_channels` (`channel_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `user_to_groups_userid_idx` ON `users_to_groups` (`user_id`);--> statement-breakpoint
-- on delete trigger for controlling removal of useChannels that a user doesn't have access to
-- after removing of a group or user to group relation
CREATE TRIGGER `delete_user_groups_trigger` AFTER DELETE ON `users_to_groups`
BEGIN
	DELETE FROM users_to_channels WHERE id IN (
		SELECT users_to_channels.id FROM users_to_channels
		JOIN channels ON channels.id = users_to_channels.channel_id
		JOIN users ON users.id = users_to_channels.user_id
		LEFT JOIN channels_to_groups ON channels_to_groups.channel_id = channels.id
		LEFT JOIN groups ON groups.id = channels_to_groups.group_id
		LEFT JOIN users_to_groups ON users_to_groups.user_id = users.id AND users_to_groups.group_id = groups.id
		WHERE users_to_groups.user_id is NULL
	);
END;