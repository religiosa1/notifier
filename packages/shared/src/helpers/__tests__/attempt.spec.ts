import { describe, it, expect } from "vitest";
import { NullishError, attempt } from "../attempt";

describe("attempt", () => {
	describe("sync", () => {
		it("returns [data, undefined] if handler succesfully finish", () => {
			const result = attempt(() => "test");
			expect(result).toEqual(["test", undefined]);
		});

		it("works as discriminated union of tuples", () => {
			const [data, error] = attempt(() => ({ foo: "bar" }));
			//@ts-expect-error no check for error yet, data is possibly undefined
			data.foo;
			if (error != null) {
				return;
			}
			// No after we checked error and aborted the execution, it's safe to use data
			data.foo;
		});

		it("returns [undefined, exception] if handler throw an exception", () => {
			const result = attempt<never, Error>(() => { throw new Error("TEST") });
			expect(result).toEqual([undefined, expect.any(Error)]);
			expect(result[1]?.message).toBe("TEST");
		});

		it("returns a special NullishException if thrown error is null or undefined", () => {
			const result1 = attempt(() => { throw null });
			expect(result1).toEqual([undefined, expect.any(NullishError)]);

			const result2 = attempt(() => { throw undefined });
			expect(result2).toEqual([undefined, expect.any(NullishError)]);
		});
	});

	describe("async", () => {
		it("returns [data, undefined] if handler succesfully finish", async () => {
			const result = attempt(async () => "test");
			await expect(result).resolves.toEqual(["test", undefined]);
		});

		it("works as discriminated union of tuples", async () => {
			const [data, error] = await attempt(async () => ({ foo: "bar" }));
			//@ts-expect-error no check for error yet, data is possibly undefined
			data.foo;
			if (error != null) {
				return;
			}
			// No after we checked error and aborted the execution, it's safe to use data
			data.foo;
		});

		it("returns [undefined, exception] if handler throw an exception", async () => {
			const result = attempt<never, Error>(async () => { throw new Error("TEST") });
			await expect(result).resolves.toEqual([undefined, expect.any(Error)]);
			const [, error] = await result;
			expect(error?.message).toBe("TEST");
		});

		it("returns a special NullishException if thrown error is null or undefined", async () => {
			const result1 = attempt(async () => { throw null });
			await expect(result1).resolves.toEqual([undefined, expect.any(NullishError)]);

			const result2 = attempt(async () => { throw undefined });
			await expect(result2).resolves.toEqual([undefined, expect.any(NullishError)]);
		});
	});
});