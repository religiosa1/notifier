import { attempt } from "../attempt";

describe("attempt", () => {
  it("return the value of expression if no error happened", () => {
    const [ data, error ] = attempt(() => 5);
    expect(data).toBe(5);
    expect(error).toBeUndefined();
  });

  it("populates the tuple 2d item with error, if its occured", () => {
    const [ data, error ] = attempt(() => { throw 4 });
    expect(data).toBeUndefined();
    expect(error).toBe(4);
  })

  it("uses default value if its provided and error happened", () => {
    const [ data, error ] = attempt(() => { throw 4 }, 1);
    expect(data).toBe(1);
    expect(error).toBe(4);
  });

  it("calls the function provided as default value and uses its return if error happened", () => {
    const errorMap = jest.fn((v) => v * 2);
    const [ data, error ] = attempt(() => { throw 2 }, errorMap);
    expect(errorMap).toBeCalledWith(2);
    expect(data).toBe(4);
    expect(error).toBe(2);
  });
});
