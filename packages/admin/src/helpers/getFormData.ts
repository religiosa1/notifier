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
        // TODO add test cases for extra fields in object (no such key in schema)
        if (autoCoerce && key in schema.shape) {
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
  const zodobj = schema.shape[key];
  if (!values.length) {
    const dflt = getType(zodobj, z.ZodFirstPartyTypeKind.ZodDefault);
    if (dflt) {
      return dflt._def.defaultValue();
    }
    if (getType(zodobj, z.ZodFirstPartyTypeKind.ZodNullable)) {
      return null;
    }
    if (getType(zodobj, z.ZodFirstPartyTypeKind.ZodOptional)) {
      return undefined;
    }
  }
  const sch = getInnerType(zodobj);
  if (sch === z.ZodFirstPartyTypeKind.ZodArray) {
    return values.map(i => coerceSimple(getInnerType(sch), i));
  }
  return coerceSimple(sch, values[0]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getType(zodobj: any, type: z.ZodFirstPartyTypeKind): any {
  if (zodobj?._def?.typeName === type) {
    return zodobj;
  }
  if (zodobj?._def?.innerType) {
    return getType(zodobj._def.innerType, type);
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getInnerType(zodobj: any): z.ZodFirstPartyTypeKind {
  if (!zodobj?._def?.innerType?._def) {
    return zodobj?._def?.typeName;
  }
  return getInnerType(zodobj?._def?.innerType);
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