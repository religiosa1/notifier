import "dotenv/config";
import fastify from "fastify";
import cookie, { FastifyCookieOptions } from '@fastify/cookie'
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { ResultError } from "@shared/models/Result";
import authorization from "src/Authorization";
import { registerLogger } from "src/logger";
import { Bot, Update } from "src/Bot";
import usersRoutes from "src/routes/users";
import groupsRoutes from "src/routes/groups";
import channelsRoutes from "src/routes/channels";
import notify from "src/routes/notify";
import authRequest from "src/routes/auth-request";

const TOKEN = process.env.BOT_TOKEN;
const prefix = process.env.URL || "";
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

export const app = fastify({ logger: true });
registerLogger(app.log);
app.register(cookie, {
  secret: process.env.JWT_SECRET,
  hook: false,
} satisfies FastifyCookieOptions);
app.register(authorization);
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(usersRoutes, { prefix });
app.register(groupsRoutes, { prefix });
app.register(channelsRoutes, { prefix });
app.register(authRequest, { prefix });

app.setErrorHandler(function (error, _, reply) {
  this.log.error(error);
  const err = error instanceof ResultError ? error : ResultError.from(error);
  reply.status(err.statusCode).send(err.toJson());
})

const bot = new Bot(TOKEN!);
app.register(notify, { bot });

app.after(async () => {
  await bot.init();
  app.route({
    method: 'POST',
    url: `/bot${TOKEN}`,
    handler: async (req) => { bot.processUpdate(req.body as Update) },
  });
  app.log.info("Bot initialized");
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

