import { ResultError } from "@shared/models/Result";

export class NotFoundError extends ResultError {
	override name = "NotFound";
	constructor(msg = "The requested record can't be found") {
		super(404, msg)
	}
}