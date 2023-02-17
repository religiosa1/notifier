export function omit<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  keys: readonly K[]
): Omit<T, K>;

export function omit<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  predicate: (
      value: T[Extract<keyof T, string>],
      key: Extract<keyof T, string>,
      object: T
  ) => unknown
): Omit<T, K>;

export function omit<T extends {}, K extends Extract<keyof T, string>>(
  obj: T,
  keys_or_predicate:
      | readonly K[]
      | ((value: unknown, key: string, object: T) => unknown)
): Omit<T, K> {
  return Object.fromEntries(
      Object.entries(obj).filter(
          typeof keys_or_predicate === 'function'
              ? ([key, value]) => !keys_or_predicate(value, key, obj)
              : ([k]) => !keys_or_predicate?.includes?.(k as any)
      )
  ) as Omit<T, K>;
}
