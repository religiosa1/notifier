#!/usr/bin/env tsx
import "../src/polyfill";

import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { SettingsService } from "src/services/SettingsService";

const consoleLogger = new ConsoleLogger();
const dataBaseMigrator = new DatabaseMigrator(
	new SettingsService(consoleLogger),
	consoleLogger
);

dataBaseMigrator.migrate();