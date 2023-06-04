import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
export type DbTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">