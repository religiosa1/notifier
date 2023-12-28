import { describe, it, expect } from "vitest";
import { decodeJWT } from "../decodeJWT";

describe("decodeJWT", () => {
	const encodedData = {
		name: "admin",
		id: 1,
	}
	const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
	const payload = "eyJuYW1lIjoiYWRtaW4iLCJpZCI6MSwiaWF0IjoxNjc2NzQ0MzY4LCJleHAiOjE2Nzc5NDQzNjh9";
	const sign = "K19lwzl-KTzIlLSv8WdhxXCj0BM7WPwy_dtO1vwcGKg";
	const validToken = [header, payload, sign].join(".");

	const expectedResult = {
		...encodedData,
		exp: expect.any(Number),
		iat: expect.any(Number),
	}

	it("parses provided token", () => {
		const result = decodeJWT(validToken);
		expect(result).toEqual(expectedResult);
	});

	it("cuts 'Bearer ' part from token, if it comes directly from header/cookie", () => {
		const result = decodeJWT("Bearer " + validToken);
		expect(result).toEqual(expectedResult);
	});

	it("throws on malformed data in a token", () => {
		expect(() => decodeJWT(header)).toThrow();
	});

	it("throws on malformed base64 data in a token", () => {
		const data = [header, "tacc&&(30W4iLCxxJpZCI6MSz%%^zzxx", sign].join(".");
		expect(() => decodeJWT(data)).toThrow();
	});

	it("throws on bad JSON-data in a token", () => {
		const payload = Buffer.from('{"bad": JSON').toString('base64');
		const data = [header, payload, sign].join(".");
		expect(() => decodeJWT(data)).toThrow();
	});

	it("throws on incorrect payload", () => {
		const payload = Buffer.from(JSON.stringify({ id: "bad" })).toString('base64');
		const data = [header, payload, sign].join(".");
		expect(() => decodeJWT(data)).toThrow();
	});
});