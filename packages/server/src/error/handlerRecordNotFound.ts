import { Prisma } from "@prisma/client";
import { ResultError } from "@shared/models/Result";

export function handlerDbNotFound(message = "requested entity doesn't exist") {
	const handler = (err: unknown) => {
		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			if (err.code === 'P2025') {
				throw new ResultError(404, message);
			}
		}
		throw err;
	}
	return handler
}