import { hasProperty } from "./hasProperty";

type MaybePromise<T> = T | Promise<T>;
type Sync<T> = T extends PromiseLike<any> ? never : T;
export type NonNullableError<T> = T extends {} ? T : NonNullable<T> | NullishError;

export type AttemptResult<TData, TError = any> =
 [data: TData, error: undefined]
 | [data: undefined, error: NonNullableError<TError>];

export function attempt<TData, TError>(handler: () => Sync<TData>): AttemptResult<TData, TError>;
export function attempt<TData, TError>(handler: () => Promise<TData>): Promise<AttemptResult<Awaited<TData>, TError>>;

export function attempt<TData, TError>(handler: () => TData): MaybePromise<AttemptResult<TData, TError>> {
	try {
		const data = handler();
		if (isPromiseLike<TData>(data)) {
			return unwrapAsyncAttempt<TData, TError>(data);
		}
		return [data, undefined];
	} catch(e) {
		const error = (e ?? new NullishError()) as NonNullableError<TError>;
		return [undefined, error];
	}
}

function isPromiseLike<T>(t: unknown): t is PromiseLike<T> {
	return hasProperty(t, "then", "function");
}

async function unwrapAsyncAttempt<T, TError = any>(prms: PromiseLike<T>): Promise<AttemptResult<Awaited<T>, TError>> {
	try {
		const data = await prms;
		return [data, undefined];
	} catch (e) {
		const error = (e ?? new NullishError()) as NonNullableError<TError>;
		return [undefined, error];
	}
}

export class NullishError extends Error {
	override name = "NullishError";
}