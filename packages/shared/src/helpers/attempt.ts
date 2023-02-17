/**
 * Call the passed action, returning a tuple of result/error.
 * Think of it, as of an inliner of try-catch.
 * @param action
 * @param defaultValue value if error happened or a function generating this value from error
 * @returns [ value, error ] tuple
 *
 * @example
 * const [ value, error ] = attempt(() => JSON.parse(data));
 * if (error) {
 *   // do something
 * } else {
 *   // do something with value
 * }
 */
export function attempt<TRet, TDef>(
  action: () => TRet,
  defaultValue?: ((err: unknown) => TDef) | TDef
):
  | [ value: TRet, error: undefined ]
  | [ value: TDef, error: NonNullable<unknown> ];
/** @inheritdoc */
export function attempt<TRet>(action: () => TRet):
 | [ value: TRet, error: undefined ]
 | [ value: undefined, error: NonNullable<unknown> ];

export function attempt<TRet, TDef = undefined>(
  action: () => TRet,
  defaultValue?: ((err: unknown) => TDef) | TDef
):
 | [ value: TRet, error: undefined ]
 | [ value: TDef, error: Exclude<unknown, undefined> ] {
  try {
    const value = action();
    return [value, undefined]
  } catch(e) {
    const fallback = isFuntion(defaultValue)
      ? defaultValue(e)
      : defaultValue as TDef
    return [ fallback, e ?? new Error("Nullish error")];
  }
}

function isFuntion(t: unknown): t is Function {
  return typeof t === "function";
}