import z from "zod";

interface GetFormDataOptions {
  autoCoerce?: boolean;
}

export function getFormData<T extends z.AnyZodObject>(
  formData: FormData,
  schema: T,
  transformers?: Partial<Record<
    keyof T['shape'],
    (
      value: FormDataEntryValue[],
      key: T['shape'],
      schema: T,
      formData: FormData,
    ) => unknown
  >>,
  {
    autoCoerce = true
  }: GetFormDataOptions = {}
): z.infer<T> {
  const rawObject = Object.fromEntries(
      Array.from(formData.keys(), (key) => {
        const tf = transformers?.[key];
        const values = formData.getAll(key);
        if (tf instanceof Function) {
          return [key, tf(values, key, schema, formData)] as const;
        }
        if (autoCoerce) {
          return [key, defaultCoerce(values, key, schema)]
        }
        return [key, values[0]] as const;
      }).filter(i => Array.isArray(i) && i.length === 2 && i[1] !== undefined)
  );
  return schema.parse(rawObject);
}

// @see https://github.com/colinhacks/zod/discussions/1763
function defaultCoerce<T extends z.AnyZodObject>(
  values: FormDataEntryValue[],
  key: T['shape'],
  schema: T,
) {
  const sch = schema.shape[key]?._def.typeName;
  if (sch === z.ZodFirstPartyTypeKind.ZodNullable && !values.length) {
    return null;
  }
  if (sch === z.ZodFirstPartyTypeKind.ZodArray) {
    return values.map(i => coerceSimple(schema.shape[key].element._def.typeName, i));
  }
  return coerceSimple(sch, values[0]);
}

function coerceSimple(sch: z.ZodFirstPartyTypeKind, value: unknown) {
  switch (sch) {
    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return Number(value);
    default:
      return value;
  }
}