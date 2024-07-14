#!/usr/bin/env tsx
import "../src/polyfill";

import { DatabaseMigrator } from "src/db/DatabaseMigrator";
import { ConsoleLogger } from "src/services/ConsoleLogger";

const consoleLogger = new ConsoleLogger();
const dataBaseMigrator = new DatabaseMigrator(
	consoleLogger
);

dataBaseMigrator.migrate();