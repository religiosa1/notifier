import { describe, expect, it } from "vitest";
import { hasField } from "../hasField";

describe("hasField", () => {
  const testData = {
    foo: 1,
    bar: undefined,
    baz: null,
    biz: "string",
    zib: new Date(),
    zab: {},
  }
  it("checks field presense in an object", () => {
    expect(hasField(testData, "foo")).toBe(true);
    expect(hasField(testData, "bad")).toBe(false);
  });

  it("returns true if a field is present in an object even if it's undefined", () => {
    expect(hasField(testData, "bar")).toBe(true);
  });

  it("checks agains a regular primitive type", () => {
    expect(hasField(testData, "foo", "number")).toBe(true);
    expect(hasField(testData, "foo", "string")).toBe(false);
  });

  it("checks undefined literal correcly", () => {
    expect(hasField(testData, "bar", "undefined")).toBe(true);
    expect(hasField(testData, "baz", "undefined")).toBe(false);
  });

  it("returns true on non-nullish fields with 'some' literal check", () => {
    expect(hasField(testData, "bar", "some")).toBe(false);
    expect(hasField(testData, "baz", "some")).toBe(false);
    expect(hasField(testData, "foo", "some")).toBe(true);
  });

  it("checks instances against the constructor", () => {
    expect(hasField(testData, "zib", Date)).toBe(true);
    expect(hasField(testData, "zab", Date)).toBe(false);
    expect(hasField(testData, "foo", Date)).toBe(false);
    expect(hasField(testData, "bar", Date)).toBe(false);
    expect(hasField(testData, "baz", Date)).toBe(false);
  });
});