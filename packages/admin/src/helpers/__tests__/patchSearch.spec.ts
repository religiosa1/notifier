import { describe, it, expect } from "vitest";
import { patchSearch } from "../patchSearch";

describe("patchSearch", () => {
	const params = {
		skip: 34,
		take: 56,
	}

	it("appends provided pagination params to url", () => {
		const result = patchSearch("/foobar", params);
		expect(result).toBe("/foobar?skip=34&take=56");
	});

	it("merges search params with existing ones", () => {
		const result = patchSearch("/foobar?foo=test", params);
		expect(result).toBe("/foobar?foo=test&skip=34&take=56");
	});

	it("overwrites existing params as needed", () => {
		const result = patchSearch("/foobar?skip=12&foo=test&take=45", params);
		expect(result).toBe("/foobar?foo=test&skip=34&take=56");
	});

	it("respsects hash in url", () => {
		const result = patchSearch("/foobar#fragment", params);
		expect(result).toBe("/foobar?skip=34&take=56#fragment");
	});

	it("respsects hash and existing search in url", () => {
		const result = patchSearch("/foobar?skip=12&foo=test&take=45#fragment", params);
		expect(result).toBe("/foobar?foo=test&skip=34&take=56#fragment");
	});

	it("doesn't touch pseudo-search in fragment", () => {
		const result = patchSearch("/foobar#fake?foo=arg", params);
		expect(result).toBe("/foobar?skip=34&take=56#fake?foo=arg")
	});
});