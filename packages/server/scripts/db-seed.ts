#!/usr/bin/env tsx
import "../src/polyfill";
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { SettingsService } from "src/services/SettingsService";

const password = process.env["NOTIFIER_ADMIN_PWD"] 
	|| await readline.createInterface({ input: stdin, output: stdout })
		.question("Enter admin's password");

if (!password) {
	console.warn("You must supply admin's password either through NOTIFIER_ADMIN_PWD ennvironment variable or in the cli.");
	process.exit(1);
}

const consoleLogger = new ConsoleLogger();
const dataBaseMigrator = new DatabaseMigrator(
	new SettingsService(consoleLogger),
	consoleLogger
);

dataBaseMigrator.seed(password);