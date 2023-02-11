import basicAuth from "@fastify/basic-auth";
import bcrypt from "bcrypt";
export async function hash(value: string, saltRounds = 10) {
  return bcrypt.hash(value, saltRounds);
}
