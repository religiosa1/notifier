#!/usr/bin/env tsx
import "../src/polyfill";
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { SettingsService } from "src/services/SettingsService";

const rl = readline.createInterface({ input: stdin, output: stdout });

const password = process.env.NOTIFIER_ADMIN_PWD || await rl.question("Enter admin's password");
if (!password) {
	console.warn("You must supply admin's password either through NOTIFIER_ADMIN_PWD ennvironment variable or in the cli.");
	process.exit(1);
}

const telegramIdInput = process.env.NOTIFIER_ADMIN_TGID || await rl.question("Enter admin's telegram ID");

const telegramId = parseInt(telegramIdInput);
if (!Number.isInteger(telegramId) || telegramId <= 0) {
	console.warn("Telegram ID (env 'NOTIFIER_ADMIN_TGID') must be an integer greater than 0");
	process.exit(1);
}

const consoleLogger = new ConsoleLogger();
const dataBaseMigrator = new DatabaseMigrator(
	new SettingsService(consoleLogger),
	consoleLogger
);

dataBaseMigrator.seed(password, telegramId);