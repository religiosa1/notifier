import { describe, it, expect } from "vitest";
import { hasProperty } from "../hasProperty";

describe("hasProperty", () => {
	const testData = {
		foo: 1,
		bar: undefined,
		baz: null,
		biz: "string",
		zib: new Date(),
		zab: {},
	}
	it("checks field presense in an object", () => {
		expect(hasProperty(testData, "foo")).toBe(true);
		expect(hasProperty(testData, "bad")).toBe(false);
	});

	it("returns true if a field is present in an object even if it's undefined", () => {
		expect(hasProperty(testData, "bar")).toBe(true);
	});

	it("checks agains a regular primitive type", () => {
		expect(hasProperty(testData, "foo", "number")).toBe(true);
		expect(hasProperty(testData, "foo", "string")).toBe(false);
	});

	it("checks undefined literal correcly", () => {
		expect(hasProperty(testData, "bar", "undefined")).toBe(true);
		expect(hasProperty(testData, "baz", "undefined")).toBe(false);
	});

	it("returns true on non-nullish fields with 'some' literal check", () => {
		expect(hasProperty(testData, "bar", "some")).toBe(false);
		expect(hasProperty(testData, "baz", "some")).toBe(false);
		expect(hasProperty(testData, "foo", "some")).toBe(true);
	});

	it("checks instances against the constructor", () => {
		expect(hasProperty(testData, "zib", Date)).toBe(true);
		expect(hasProperty(testData, "zab", Date)).toBe(false);
		expect(hasProperty(testData, "foo", Date)).toBe(false);
		expect(hasProperty(testData, "bar", Date)).toBe(false);
		expect(hasProperty(testData, "baz", Date)).toBe(false);
	});
});