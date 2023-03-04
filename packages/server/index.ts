import "dotenv/config";
import fastify from "fastify";
import cookie, { FastifyCookieOptions } from '@fastify/cookie'
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import authorizeJWT from "src/Authorization/pluginJWT";
import authorizeKey from "src/Authorization/pluginKey";
import { registerLogger } from "src/logger";
import { Bot, SendMessageProps, Update } from "src/Bot";
import usersRoutes from "src/routes/users";
import groupsRoutes from "src/routes/groups";
import { ResultError } from "src/models/Result";

const TOKEN = process.env.BOT_TOKEN;
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

export const app = fastify({ logger: true });
registerLogger(app.log)
app.register(cookie, {
  secret: process.env.JWT_SECRET,
  hook: false,
} satisfies FastifyCookieOptions);
app.register(authorizeJWT);
app.register(authorizeKey);
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(usersRoutes);
app.register(groupsRoutes);

app.setErrorHandler(function (error, _, reply) {
  this.log.error(error);
  const err = error instanceof ResultError ? error : ResultError.from(error);
  reply.status(err.statusCode).send(err.toJson());
})

const bot = new Bot(TOKEN!);

app.after(() => {
  app.route({
    method: 'POST',
    url: '/notify',
    onRequest: app.authorizeKey,
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

