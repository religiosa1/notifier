import { Prisma  } from "@prisma/client";
import { ResultError } from "src/models/Result";

export function joinFields(fields: string[]) {
  return fields.map(i => `"${i}"`).join(", ");
}

const defaultMessage =  (fields: string[] | undefined) => Array.isArray(fields)
  ? `unique constraint failed on field: ${joinFields(fields)}`
  : "unique constraint failed on unknown field";

export function handlerUniqueViolation(
  message: string | ((val: string[] | undefined) => string) = defaultMessage
) {
  const handler = (err: unknown) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const mes = typeof message === "function" ? message(err.meta?.['target'] as string[] | undefined) : message;
        throw new ResultError(409, mes);
      }
    }
    throw err;
  }
  return handler
}