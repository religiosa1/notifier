import "dotenv/config";
import fastify from "fastify";
import { Bot, SendMessageProps, Update } from "src/Bot";
import { authenticator } from "src/authentication";
import { registerLogger } from "src/logger";

const TOKEN = process.env.BOT_TOKEN;
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

export const app = fastify({ logger: true });
registerLogger(app.log)
const bot = new Bot(TOKEN!);

app.register(...authenticator);

app.after(() => {
  app.route({
    method: 'POST',
    url: '/notify',
    onRequest: app.basicAuth,
    handler: async (req) => {
      return bot.sendMessage(req.body as SendMessageProps);
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

