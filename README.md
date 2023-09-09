# Telegram Notifier Service

[Telegram](https://telegram.org/) notification service monorepo.

Allows:
- sending broadcast messages to your users through a REST-API
- manage your users, user groups and notification channels through a web-admin
- aloows you and your users to manage their subscription through a telegram bot

## Packages:

- server: backend for providing REST API for communication with the bot, storing
  user and groups data and the telegram bot itself.
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

### Telegram bot commands, available for approved users:
- Ask for a new API key from the bot via `/new_key` command.
- Review the list of available API keys via `/list_keys` command.
- Revoke the existing API key via `/remove_key` command.
- Request a list of available notification channels via `/list_channels` command
  (notifications accessible to the user controlled by admin with groups mechanism).
- Get a list of subscribed notifications via `/list_subscriptions` command.
- Join a notification channel via `/join_channel` command.
- Leave a channel via `/leave_channel` command.

### The admin panel allows an admin to:
- Directly send a message to one or many notification channels.
- Review, approve, and reject authorization requests.
- Revoke user's API keys or user's authorization.
- Manage notification channels.
- Manage users' groups, allowing them to access certain notification channels.

## REST-API for public usage:

Each approved user can have zero or multiple API keys. If this token is included in `X-API-KEY` header or cookie, then the user can perform a notification request to the public API:

- **URL:** `/notify`
- **Method:** `POST`
- **Description:** Send a message to channel subscribers

#### Request:

```http
POST /notify
Content-Type: application/json
x-api-key: USERS_API_KEY

{
    "channels": ["default"],
    "body": "This is the message of notification."
}
```
#### Response:
```json
{ "success": true }
```

## License
all of these packages are MIT licensed.