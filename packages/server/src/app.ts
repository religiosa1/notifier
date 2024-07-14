import { di } from "src/injection";

import { Hono } from "hono";
import { ResultError } from "@shared/models/Result";
import { checkSettings } from "src/middleware/checkSettings";
import { responseHandler } from "src/middleware/responseHandler";
import { logger } from "src/middleware/logger";

import settings from "src/routes/settings";
import usersController from "src/routes/users";
import groupsController from "src/routes/groups";
import channelsController from "src/routes/channels";
import authRequestController from "src/routes/user-confirmation-request";
import notifyController from "src/routes/notify";
import loginController from "src/routes/login";
import botController from "src/routes/bot";

export const app = new Hono();
app.onError((err) => {
	di.inject("logger").error(err);
	const resultError = ResultError.from(err);
	return  new Response(resultError.toJson(), {
		status: resultError.statusCode,
		headers: { "Content-Type": "application/json; charset=UTF-8" }
	});
});
app.use("*", logger);
app.use("*", responseHandler);
app.use("*", checkSettings);
app.route("/settings", settings);
app.route("/users", usersController);
app.route("/groups", groupsController);
app.route("/channels", channelsController);
app.route("/user-confirmation-request", authRequestController);
app.route("/notify", notifyController);
app.route("/login", loginController);
app.route("/bot", botController);
app.get("/", (c) => c.body(null, 204));