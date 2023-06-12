import bcrypt from "bcrypt";
export async function hash(value: string, saltRounds?: number): Promise<string>;
export async function hash(
	value: string | null | undefined,
	saltRounds?: number
): Promise<string | null | undefined>;

/**
 * Hash provided password.
 * @param value
 * @param saltRounds
 * @returns undefined if value is undefined, null if value is falsy, hashed and salted value otherwise
 */
export async function hash(
	value: string | null | undefined,
	saltRounds = 10
): Promise<string | null | undefined> {
	if (value == undefined) {
		return value;
	}
	return bcrypt.hash(value, saltRounds);
}
