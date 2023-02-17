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
  })
  // TODO what about files in formData?..
  it("parses supplied formData by the schema, autocoercing numbers", () => {
    const result = getFormData(formData, schema);
    expect(result).toEqual({
      foo: "qwerty",
      bar: 123,
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
    const result = getFormData(formData, schema);
    expect(result).toEqual({
      foo: [ 1, 2, 3]
    });
  });

  it("allows to specify transformes in arguments", () => {
    const result = getFormData(formData, schema, {
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

  // TODO autoCoerce disbaled tests + nullable tests
});