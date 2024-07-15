#!/usr/bin/env tsx
import "../src/polyfill";

import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";
import { SettingsService } from "src/services/SettingsService";

const consoleLogger = new ConsoleLogger();
const dataBaseMigrator = new DatabaseMigrator(
	new DatabaseConnectionManager(
		new SettingsService(),
		consoleLogger
	),
	consoleLogger
);

dataBaseMigrator.migrate();