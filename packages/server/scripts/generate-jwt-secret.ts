#!/usr/bin/env tsx
import { randomBytes } from "crypto";
const secret = randomBytes(256).toString('base64');
if (process.stdout.isTTY) {
	console.log("Bellow is your jwt secret.");
	console.log("Add it to your environmental variable\n");
}
console.log(secret);