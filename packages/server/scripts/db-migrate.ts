#!/usr/bin/env tsx
import "../src/polyfill";

import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";
import { SettingsService } from "src/services/SettingsService";

const dataBaseMigrator = new DatabaseMigrator(
	new SettingsService(),
	new ConsoleLogger(),
)

dataBaseMigrator.migrate();