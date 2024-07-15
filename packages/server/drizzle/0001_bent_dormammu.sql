CREATE INDEX `channels_to_group_groupid_idx` ON `channels_to_groups` (`group_id`);--> statement-breakpoint
CREATE INDEX `user_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `user_to_channels_userId_idx` ON `users_to_channels` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_to_groups_userid_idx` ON `users_to_groups` (`user_id`);