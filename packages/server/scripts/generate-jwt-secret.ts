#!/usr/bin/env tsx
import { randomBytes } from "crypto";
const secret = randomBytes(256).toString('base64');
if (process.stdout.isTTY) {
	console.log("Bellow is your jwt secret.");
	console.log("You can paste it your 'config.json' file under the field 'jwtSecret'\n");
}
console.log(secret);