/**
 * Check that object o has a k of type k, and optionally check
 * that it is a specific primitive type, instance of some class or not null.
 *
 * Without the type arg, this method checks that field with key k is present
 * in the object. It can be any type, including `undefined` like this:
 * { foo: undefined }. 
 * 
 * String value of type will trigger typeof check, with a
 * special value "some" which performs non-null checks.
 *
 * @param o object to check for the field availability
 * @param k field key
 * @param t optional type param
 */
export function hasProperty<K extends string>(o: unknown, k: K): o is Record<K, unknown>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "some"
): o is Record<K, {}>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "string"
): o is Record<K, string>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "boolean"
): o is Record<K, boolean>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "function"
): o is Record<K, (...agrs: unknown[]) => unknown>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "number"
): o is Record<K, number>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "object"
): o is Record<K, object>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "string"
): o is Record<K, string>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "symbol"
): o is Record<K, symbol>;
export function hasProperty<K extends string>(
	o: unknown, k: K, t: "undefined"
): o is Record<K, undefined>;
export function hasProperty<K extends string, T>(
	o: unknown, k: K, t: { new (...agrs: unknown[]): T }
): o is Record<K, T>;

export function hasProperty<
	K extends string,
	T extends string | (abstract new (...args: unknown[]) => unknown)
>(o: unknown, k: K, t?: T): boolean {
	if (!o || typeof o !== "object" || !(k in o)) {
		return false;
	}
	if (t == null) {
		return true;
	}
	const v = o[k as keyof object] as unknown;
	if (typeof t == "function") {
		return v instanceof t;
	}
	if (t === "some") {
		return v != null;
	}
	return typeof v === t;
}