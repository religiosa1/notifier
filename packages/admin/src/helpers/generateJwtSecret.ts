import { randomBytes } from "crypto";

export function generateJwtSecret() {
	return randomBytes(256).toString("base64");
}