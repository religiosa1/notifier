import { Hono } from 'hono'
import z from "zod";
import { zValidator } from '@hono/zod-validator'

import bcrypt from "bcrypt";
import { ResultError } from "@shared/models/Result";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { tokenPayloadSchema } from "@shared/models/TokenPayload";
import { di } from "src/injection";

import { sign } from 'hono/jwt'

const controller = new Hono();

controller.post(
	"/", 
	zValidator("json", z.object({
		name: z.string().max(32),
		password: z.string().max(32),
	})),
	async (c) => {
		const usersRepository = di.inject("UsersRepository");
		const settingsService = di.inject("SettingsService");
		const {jwtSecret} = settingsService.getConfig() ?? {};
		if (!jwtSecret) {
			throw new Error("JWT secret hasn't been initialized");
		}

		const { name, password } = c.req.valid("json");
		const user = await usersRepository.getUserByName(name);
		if (
			!user?.password ||
			!await bcrypt.compare(password, user.password)
		) {
			throw new ResultError(401, "Wrong name/password pair");
		}
		if (user.role !== UserRoleEnum.admin) {
			throw new ResultError(403, "You don't have required permissions");
		}
		const payload = tokenPayloadSchema.omit({ iat: true, exp: true }).parse(user);
		const token = sign(payload, jwtSecret, "HS256");

		return c.json({ token, user });
	}
)

export default controller;
