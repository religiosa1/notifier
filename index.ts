import "dotenv/config";
import fastify from "fastify";
import type { Update, SendMessageOptions } from "node-telegram-bot-api";
import { Bot } from "./src/Bot";
import { authenticator } from "./src/authentication";

const TOKEN = process.env.BOT_TOKEN;
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

const app = fastify({ logger: true });
const bot = new Bot(TOKEN!);

app.register(...authenticator);

app.after(() => {
  app.route({
    method: 'POST',
    url: '/notify',
    onRequest: app.basicAuth,
    handler: async (req) => {
      return bot.sendMessage(req.body as { text: string } & SendMessageOptions);
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

