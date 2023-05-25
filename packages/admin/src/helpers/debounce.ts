export interface DebounceControls {
  signal: AbortSignal;
}

export function debounce<TRet, TArgs extends readonly unknown[]>(
  cb: (this: DebounceControls, ...args: TArgs) => TRet,
  time = 100
): (...args: TArgs) => TRet {
  let lastCallTime: number | undefined;
  let lastRetValue: TRet | undefined;
  let controller: AbortController | undefined;
  let to: ReturnType<typeof setTimeout> | undefined;

  return function debounced(...args: TArgs): TRet {
    const now = Date.now();
    if (lastCallTime == null || now - lastCallTime > time) {
      lastCallTime = now;
      controller?.abort();
      controller = new AbortController();
      lastRetValue = cb.call({ signal: controller.signal }, ...args);
    } else {
      if (to) {
        clearTimeout(to);
      }
      to = setTimeout(() => {
        to = undefined;
        debounced(...args);
      }, time);
    }
    return lastRetValue as TRet;
  }
}