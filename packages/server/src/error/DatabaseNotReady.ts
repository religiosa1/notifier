import { ResultError } from "@shared/models/Result";

export class DatabaseNotReady extends ResultError {
	override readonly name = "DatabaseNotReady";
	constructor() {
		super(503, "Database connection isn't available or not ready to perform queries");
	}
}