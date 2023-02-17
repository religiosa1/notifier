import { partition } from "../partition";
describe("partition", () => {
  const testData = [1, 2, 3, 4, 5, 6];
  const predicate = jest.fn((v: number, idx: number, ar: Iterable<number>) => v % 2 === 0);

  function *gen() {
    for (let i = 1; i < 7; i++) {
      yield i;
    }
  }

  it("splits an array by predicate", () => {
    const [ t, f ] = partition(testData, predicate);
    expect(t).toEqual([2, 4, 6]);
    expect(f).toEqual([1, 3, 5]);
  });

  it("splits an iterable by predicate", () => {
    const [ t, f ] = partition(gen(), predicate);
    expect(t).toEqual([2, 4, 6]);
    expect(f).toEqual([1, 3, 5]);
  });

  it("passes the expected args to predicate", () => {
    const arr = [1];
    partition([1], predicate);
    expect(predicate).toHaveBeenLastCalledWith(1, 0, arr);
  });
});