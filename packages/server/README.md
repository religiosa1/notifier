# Telegram notifier backend

Telegram bot and REST API backend.

Creates a [Hono](https://hono.dev/) http server, to expose API and
[bot](https://github.com/yagop/node-telegram-bot-api) webhook.

Available endpoints are specified in the [routes](./src/routes/) folder.

Stores information about groups, channels and users in the postgres DB, managed by
[drizzle](https://orm.drizzle.team/). You can see all of the DB connection 
methods in the [repositories](./src/repositories/) folder.

There are migration scripts and db seeding provided in the [scripts](./scripts/) 
folder, but you probably do not need them, as this all is handled by the setup
page of admin. Use them only if you know what you're doing.