import "dotenv/config";
import fastify from "fastify";
import type { Update, SendMessageOptions } from "node-telegram-bot-api";
import { BotMock } from "./src/BotMock";
import { authenticator } from "./src/authentication";

const TOKEN = process.env.BOT_TOKEN;
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

const app = fastify({ logger: true });
const bot = new BotMock(TOKEN!);

app.register(...authenticator);

app.after(() => {
  app.route({
    method: 'POST',
    url: '/notify',
    onRequest: app.basicAuth,
    handler: async (req) => {
      const {
        chatId,
        text,
        ...options
      } = req.body as { chatId: number | string, text: string } & SendMessageOptions;
      return bot.sendMessage(chatId, text, options);
    }
  });

  app.route({
    method: 'POST',
    url: `/bot${TOKEN}`,
    handler: async (req) => { bot.processUpdate(req.body as Update) },
  });
});


const start = async () => {
  try {
    await app.listen({ host, port });
    app.log.info(`Setting webhook on ${url}/bot${TOKEN}`);
    let d = await bot.setWebHook(`${url}/bot${TOKEN}`);
    app.log.info("Webhook is set", d);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
start();

