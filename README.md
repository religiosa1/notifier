# Telegram Notifier Service

[Telegram](https://telegram.org/) notification service monorepo.

Allows sending broadcast messages to your users through a REST-API.

## Packages:

- server: backend for providing REST API for communication with the bot, storing
  user and groups data.
- admin: Web-interface for the server to accept/remove users and notification
  groups. CRUD for notification groups, etc.

## Deployment TODO

## Short workflow description TODO

A user who wants to receive notifications goes to the bot account in Telegram
and executes `/start` command.

This command will create a request for activation in the admin panel and
optionally sends a notification to the admin.

Once the user request is accepted, they will be notified by the bot that they
can start using the API.

After that, a user can:
- Ask for a new API token from the bot via `/new-key` command.
- Review the list of available API tokens via `/list-keys` command.
- Revoke the existing API token via `/remove-key` command.
- Request a list of available notification channels via `/list-channels-all` command
  (notifications accessible to the user controlled by admin with groups mechanism).
- Get a list of subscribed notifications via `/list-channels` command.
- Join a notification channel via `/join-channel` command.
- Leave a channel via `/leave-channel` command.

The admin panel allows an admin to:
- Directly send a message to one or many notification channels.
- Review, approve, and reject authorization requests.
- Revoke user's API keys or user's authorization.
- Manage notification channels.
- Manage users' groups, allowing them to access certain notification channels.

## License
all of these packages are MIT licensed.