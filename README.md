# Telegram notifier service

[telegram](https://telegram.org/) notification service monorepo.

## Packages:

- backend for providing REST API for communication with the bot, storing
  user and groups data.
- Web-interface for backend to accept/remove users and notification groups.
  CRUD for notification groups

## Short workflow description TODO

A user who wants to recieve notifications goes to the bot account in telegram
and executes `/start` command.

This command will create a request for activiation in the admin panel and
optionally sends a notification to the admin.

Once the user request is accepted, he will be notified by the bot, that he can
start using the API.

After that, a user can:
- ask for a new API token from bot via `/new-key` command
- review list of available API tokens via `/list-keys` command
- revoke the existing API token via `/remove-key` command
- request a list of available notification channels via `/list-channels-all` command
  (notifications accessible to the user controlled by admin with groups mechanism)
- get a list of subscribed notifications via `/list-channels` command
- join a notification channel via `/join-channel` command
- leave a channel via `/leave-channel` command

Admin panel allows an admin to:
- directly send a message to one or many notification channels
- review, approve, and reject authorization requests
- revoke user's API keys or user's authorization
- manage notification channels
- manage users groups, allowing them to access certain notification channels