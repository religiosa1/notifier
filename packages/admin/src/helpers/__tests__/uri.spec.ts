import { uri } from "../uri";
import { describe, it, expect } from "vitest";

describe("uri", () => {
  it("encodes the unsafe expression in tagged temolates", () => {
    expect(uri`test ${"t t"}`).toBe("test t%20t");
  });

  it("doesn't change the passed value, if it's good", () => {
    expect(uri`test ${123}`).toBe("test 123");
  });

  it("encodes multiple passed values as required", () => {
    expect(uri`${'a a'}/${'b b'}/${'c c'}/`).toBe("a%20a/b%20b/c%20c/");
  });
});