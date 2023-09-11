import z from "zod";

interface GetFormDataOptions {
  autoCoerce?: boolean;
}

// Correct type?
type ZodObjectType = any;

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
  const formDataData = Object.fromEntries(
      Array.from(formData.keys(), (key) => {
        const values = formData.getAll(key);
        const tf = transformers?.[key];
        if (tf instanceof Function) {
          return [key, tf(values, key, schema, formData)] as const;
        }
        // TODO add test cases for extra fields in object (no such key in schema)
        const schemaField = schema.shape[key];
        if (autoCoerce && schemaField) {
          return [key, coerce(values, schemaField)]
        }
        return [key, values[0]] as const;
      }).filter(i => Array.isArray(i) && i.length === 2 && i[1] !== undefined)
  );
  return schema.parse(formDataData);
}

// @see https://github.com/colinhacks/zod/discussions/1763
function coerce(
  values: FormDataEntryValue[],
  schemaField: ZodObjectType
) {
  if (!values.length) {
    const defaultValue = getInnerZodObjectOfType(schemaField, z.ZodFirstPartyTypeKind.ZodDefault);
    if (defaultValue) {
      return defaultValue._def.defaultValue();
    }
    if (getInnerZodObjectOfType(schemaField, z.ZodFirstPartyTypeKind.ZodNullable)) {
      return null;
    }
    return undefined;
  }
  const sch = getInnerFirstPartyTypeKind(schemaField);
  if (sch === z.ZodFirstPartyTypeKind.ZodArray) {
    console.log("SCH2", schemaField._def.type)
    return values.map(i => coerceSimple(schemaField._def.type, i));
  }
  return coerceSimple(schemaField, values[0]);
}

function getInnerZodObjectOfType(
  zodobj: ZodObjectType,
  type: z.ZodFirstPartyTypeKind
): ZodObjectType | undefined {
  if (zodobj?._def?.typeName === type) {
    return zodobj;
  }
  if (zodobj?._def?.innerType) {
    return getInnerZodObjectOfType(zodobj._def.innerType, type);
  }
  return undefined;
}

function getInnerFirstPartyTypeKind(zodobj: ZodObjectType): z.ZodFirstPartyTypeKind {
  if (!zodobj?._def?.innerType?._def) {
    return zodobj?._def?.typeName;
  }
  return getInnerFirstPartyTypeKind(zodobj?._def?.innerType);
}

function coerceSimple(sch: z.ZodType, value: unknown) {
  const typeName = "typeName" in sch._def && typeof sch._def.typeName === "string"
    ? sch._def.typeName
    : undefined;

  switch (typeName) {
    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return Number(value);
    default:
      return value;
  }
}