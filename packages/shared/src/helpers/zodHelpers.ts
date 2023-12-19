
export function intGt(gt: number) {
  return [
    (value: string) => {
      const parsedValue = parseInt(value, 10);
      return !isNaN(parsedValue) && parsedValue > gt;
    },
    { message: `Must be an integer greater than ${gt}`}
  ] as const;
}

export const toInt = (val: string) => parseInt(val, 10);