# Telegram notifier backend

Telegram REST API and bot backend.

Creates a [Fastify](https://www.fastify.io/) server, to expose API and
[bot](https://github.com/yagop/node-telegram-bot-api) webhook.

Stores information about groups, channels and users in the DB, managed by
[Prisma](https://www.prisma.io/)

