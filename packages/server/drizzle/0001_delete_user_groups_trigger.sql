-- on delete trigger for controlling removal of useChannels that a user doesn't have access to
-- after removing of a group or user to group relation
CREATE OR REPLACE FUNCTION remove_orphaned_users_to_channels()
RETURNS TRIGGER AS $$
BEGIN
	WITH orphaned AS (
		SELECT users_to_channels.id FROM users_to_channels
		JOIN channels ON channels.id = users_to_channels.channel_id
		JOIN users ON users.id = users_to_channels.user_id
		LEFT JOIN channels_to_groups ON channels_to_groups.channel_id = channels.id
		LEFT JOIN groups ON groups.id = channels_to_groups.group_id
		LEFT JOIN users_to_groups ON users_to_groups.user_id = users.id AND users_to_groups.group_id = groups.id
		WHERE users_to_groups.user_id is NULL
	)
	DELETE FROM users_to_channels WHERE id IN (SELECT id FROM orphaned);
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- after deleting a group, this should be triggered on user_group by cascade
CREATE OR REPLACE TRIGGER delete_user_groups_trigger
AFTER DELETE ON users_to_groups
FOR EACH STATEMENT
EXECUTE FUNCTION remove_orphaned_users_to_channels();