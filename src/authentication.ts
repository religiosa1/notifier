import basicAuth from "@fastify/basic-auth";
import bcrypt from "bcrypt";
import fs from "fs/promises";

const saltRounds = 10;
const authenticate = { realm: "notifier" };
const pwdfile = process.env.PWDFILE || "./passwds";

export async function getCredentials() {
  const cont = await fs.readFile(pwdfile, "utf-8");
  const entries = cont.split(/\r?\n/);
  const pwdMap = new Map<string, string>();
  for (const line of entries) {
    const [ username, password ] = line.split(':');
    if (password) {
      pwdMap.set(username, password);
    }
  }
  return pwdMap;
}

export async function hash(value: string) {
  return bcrypt.hash(value, saltRounds);
}

let passwds: Map<string, string> | undefined;
async function validate(username: string, password: string) {
  if (!passwds) {
    passwds = await getCredentials();
  }
  const stored = passwds.get(username);
  const match = stored && bcrypt.compare(password, stored);
  if (!match) {
    return new Error('Incorrect username or password');
  }
}

export const authenticator = [ basicAuth, { validate, authenticate } ] as const;