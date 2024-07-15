#!/usr/bin/env tsx
import "dotenv/config";
import "../src/polyfill";

import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";
import { SettingsService } from "src/services/SettingsService";

{
	const consoleLogger = new ConsoleLogger();	
	using settingsService = new SettingsService(consoleLogger);
	using dbm = new DatabaseConnectionManager(settingsService, consoleLogger);
	using dataBaseMigrator = new DatabaseMigrator(dbm, consoleLogger);

	await dataBaseMigrator.migrate();
}
process.exit();
