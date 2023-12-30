import { describe, it, expect, vi } from "vitest";
import { getFormData } from "../getFormData";
import z from "zod";

describe("getFormData", () => {
	const formData = new FormData();
	formData.set("foo", "qwerty");
	formData.set("bar", "123");

	const schema = z.object({
		foo: z.string(),
		bar: z.number(),
	});

	it("parses supplied formData by the schema, autocoercing numbers", () => {
		const [result] = getFormData(formData, schema);
		expect(result).toEqual({
			foo: "qwerty",
			bar: 123,
		});
	});

	it("parses booleans from checkboxes", () => {
		const schema = z.object({
			testTruthy: z.boolean({ coerce: true }),
			testTruthyOptional: z.boolean({ coerce: true }).optional(),
			testFalsy: z.boolean({ coerce: true }),
			testFalsyOptional: z.boolean({ coerce: true }).optional(),
		});
		const formData = new FormData();
		formData.set("testTruthy", "on");
		formData.set("testTruthyOptional", "on");
		const [result] = getFormData(formData, schema);
		expect(result).toEqual({
			testTruthy: true,
			testTruthyOptional: true,
			testFalsy: false,
			testFalsyOptional: undefined,
		});
	});

	it("correctly handles array data in formData", () => {
		const formData = new FormData();
		formData.append("foo", "1");
		formData.append("foo", "2");
		formData.append("foo", "3");
		const schema = z.object({
			foo: z.array(z.number())
		});
		const [result] = getFormData(formData, schema);
		expect(result).toEqual({
			foo: [ 1, 2, 3]
		});
	});

	it("allows to specify transformes in arguments", () => {
		const [result] = getFormData(formData, schema, {
			bar: (value) => Number(value) - 23
		});
		expect(result).toEqual({
			foo: "qwerty",
			bar: 100,
		});
	});

	it("transformers are called only for specified fields, with expected args", () => {
		const barTransform = vi.fn((v: unknown) => Number(v));
		getFormData(formData, schema, {
			bar: barTransform
		});

		expect(barTransform).toBeCalledTimes(1);
		expect(barTransform).toBeCalledWith(["123"], "bar", schema, formData);
	});

	it("throws an error, if formData value doesn't match the schema", () => {
		const fd2 = new FormData();
		fd2.set("foo", "qwerty");
		expect(() => getFormData(fd2, schema)).toThrow();
	});

	describe("nullable tests", () => {
		const formData = new FormData();
		formData.set("notEmpty", "123");

		it("fills empty nullable fields as nulls", () => {
			const schema = z.object({
				empty: z.string().nullable(),
				notEmpty: z.string().nullable(),
			});
			const [result] = getFormData(formData, schema);
			expect(result).toEqual({
				empty: null,
				notEmpty: "123"
			});
		});

		it("fills empty optional fields as undefined", () => {
			const schema = z.object({
				empty: z.string().optional(),
				notEmpty: z.string().optional(),
			});
			const [result] = getFormData(formData, schema);
			expect(result).toEqual({
				empty: undefined,
				notEmpty: "123"
			});
		});

		it("fills items with default values as their default", () => {
			const schema = z.object({
				empty: z.string().default("test"),
				notEmpty: z.string().nullable(),
			});
			const [result] = getFormData(formData, schema);
			expect(result).toEqual({
				empty: "test",
				notEmpty: "123"
			});
		});

		it("applies coercion for nullable items as required", () => {
			const [resultNullable] = getFormData(formData,	z.object({
				notEmpty: z.number().nullable(),
			}));
			expect(resultNullable).toEqual({
				notEmpty: 123,
			});
		});

		it("applies coercion for nullable items as required", () => {
			const [resultNullable] = getFormData(formData,	z.object({
				notEmpty: z.number().optional(),
			}));
			expect(resultNullable).toEqual({
				notEmpty: 123,
			});
		});
	});
});