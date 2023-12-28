import { describe, expect, it } from "vitest";
import { getPaginationParams, paginate } from "../pagination";

describe("pagination", () => {
	const dr = "http://example.com/";

	describe("getPaginationParams", () => {
		it("extracts current pagination params from the url", () => {
			const url = new URL("/foobar?page=3&take=30", dr);
			const result = getPaginationParams(url);
			expect(result).toEqual({
				skip: 60, // => 30 * (3 - 1)
				take: 30,
			});
		});

		it("uses default params, if some or all of params are not present", () => {
			expect(getPaginationParams(new URL("/foobar?page=3", dr))).toEqual({
				skip: 40, // => 20 * (3 - 1)
				take: 20, // from default
			});
			expect(getPaginationParams(new URL("/foobar?take=69", dr))).toEqual({
				skip: 0, // => 69 * (defaultPage=1 - 1)
				take: 69,
			});
			expect(getPaginationParams(new URL("/foobar", dr))).toEqual({
				skip: 0, // => 20 * (defaultPage=1 - 1)
				take: 20, // from default
			});
		});

		it("accepts custom defaultPage size", () => {
			const url = new URL("/foobar", dr);
			const result = getPaginationParams(url, 69);
			expect(result.take).toBe(69);
		});

		it("uses default params if url params are malformed", () => {
			expect(getPaginationParams(new URL("/foobar?page=foo&take=false", dr))).toEqual({
				skip: 0,
				take: 20,
			});
		});

		it("uses default params if url params are less then minimal possible value", () => {
			expect(getPaginationParams(new URL("/foobar?take=69", dr))).toEqual({
				skip: 0, // => 69 * (defaultPage=1 - 1)
				take: 69,
			});
		});
	});

	describe("paginate", () => {
		const params = {
			skip: 34,
			take: 56,
		}

		it("appends provided pagination params to url", () => {
			const result = paginate(params, "/foobar");
			expect(result).toBe("/foobar?skip=34&take=56");
		});


		it("gathers pagination params from url", () => {
			const result = paginate(new URL("/foobar?page=3&take=25", dr), "/foobar");
			expect(result).toBe("/foobar?skip=50&take=25");
		});
	});
});