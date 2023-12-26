import { urlJoin } from "../urlJoin";

describe("urlJoin", () => {
	it("joins two path components", () => {
		expect(urlJoin("a", "b")).toBe("a/b");
	});

	it("joins multiple path components", () => {
		expect(urlJoin("foo", "biz", "bar")).toBe("foo/biz/bar");
	});

	it("doesn't append extra slashes if components already has them", () => {
		expect(urlJoin("foo/", "/biz", "/bar")).toBe("foo/biz/bar");
	});

	it("doesn't cut the trailing slash", () => {
		expect(urlJoin("foo/", "/biz", "/bar/")).toBe("foo/biz/bar/");
	});

	it("if a path contains multiple slashes don't change anything about it", () => {
		expect(urlJoin("http://asdf/", "idiotic//", "/bar")).toBe("http://asdf/idiotic//bar");
	});

	it("returns an empty string if no args provided", () => {
		expect(urlJoin()).toBe("");
	});

	it("if one argument is provided it isn't changed", () => {
		expect(urlJoin("foo")).toBe("foo");
		expect(urlJoin("biz/")).toBe("biz/");
		expect(urlJoin("/bar/")).toBe("/bar/");
	});
});