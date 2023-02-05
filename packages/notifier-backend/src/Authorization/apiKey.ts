
import { randomBytes } from "crypto";
import { base32, base64 } from 'rfc4648';
import { apiKeySchema } from "src/Models/ApiKey";

export function generateApiKey(): string {
  const key = base64.stringify(randomBytes(30))
  const prefix = base32.stringify(randomBytes(5));
  return prefix + '.' + key;
}

export function parseApiKey(apiKey: string): [prefix: string, key: string] {
  const validated = apiKeySchema.parse(apiKey);
  const [ prefix, key ] = validated.split('.', 2);
  return [ prefix, key ];
}
