/** Pick string keys from object, omitting the prototype */
export function pick<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  keys: readonly K[]
): Pick<T, K>;

/** Pick string keys from object satisfying the predicate.*/
export function pick<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  predicate: (
      value: T[Extract<keyof T, string>],
      key: Extract<keyof T, string>,
      object: T
  ) => unknown
): Pick<T, K>;

export function pick<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  keys_or_predicate:
      | ((
            value: T[Extract<keyof T, string>],
            key: Extract<keyof T, string>,
            object: T
        ) => unknown)
      | readonly K[]
): Pick<T, K> {
  const retval = {} as Pick<T, K>;
  if (typeof keys_or_predicate === 'function') {
      for (const key of Object.keys(obj) as Extract<keyof T, string>[]) {
          if (keys_or_predicate(obj[key], key, obj)) {
              retval[key as keyof Pick<T, K>] = obj[key as keyof Pick<T, K>];
          }
      }
  } else {
      for (const key of keys_or_predicate) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
              retval[key] = obj[key];
          }
      }
  }
  return retval;
}
