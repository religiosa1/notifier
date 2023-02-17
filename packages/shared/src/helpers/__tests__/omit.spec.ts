import { pick } from "../pick";

describe("pick", () => {
    const testData = new (class {
        foo = 1;
        bar = 2;
        baz() {}
    })();

    it("picks specified keys from the object", () => {
        const result = pick(testData, ["foo"]);
        expect(result).toEqual({
            foo: 1,
        });
    });

    it("picks keys, determined by the predicate", () => {
        const result = pick(testData, (val) => val === 1);
        expect(result).toEqual({
            foo: 1,
        });
    });

    it("passes the correct values to the predicate", () => {
        const predicate = jest.fn(() => {});
        const testData = {
            foo: 1,
        };
        pick(testData, predicate);
        expect(predicate).toBeCalledWith(1, "foo", testData);
    });

    it("doesn't pick properties from prototype", () => {
        const result = pick(testData, ["baz"]);
        expect(result.baz).toBeUndefined();
    });
});
