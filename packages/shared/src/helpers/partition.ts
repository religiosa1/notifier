export function partition<
  T,
  TIter extends Iterable<T>,
  TThis = never
>(
  iterable: TIter,
  predicate: (value: T, index: number, array: TIter) => unknown,
  thisArg?: TThis
): [ truthy: T[], falsy: T[] ] {
  const truthy:  T[] = [];
  const falsy: T[] = [];
  const i = 0;
  for (const item of iterable) {
    if (predicate.call(thisArg, item, i, iterable)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [ truthy, falsy ];
}