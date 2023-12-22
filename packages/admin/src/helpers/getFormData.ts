import z from "zod";

// TODO: Correct type?
type ZodObjectType = any;

type FormDataTransformers<TSchema extends z.AnyZodObject> = {
	[k in keyof TSchema['shape']]?: (
		value: FormDataEntryValue[],
		key: TSchema['shape'],
		schema: TSchema,
		formData: FormData,
	) => unknown
}

export function getFormData<T extends z.AnyZodObject>(
	formData: FormData,
	schema: T,
	transformers?: FormDataTransformers<T>
): z.infer<T> {
	const formDataData: Record<string, FormDataEntryValue[]>= Object.fromEntries(
			Array.from(formData.keys(), (key) => {
				const values = formData.getAll(key);
				return [key, values];
			})
			// TODO: Why it was here?
			// .filter(i => Array.isArray(i) && i.length === 2 && i[1] !== undefined)
	);
	const coercedData: Record<string, unknown> = { ...formData };
	for (const [key, schemaField] of Object.entries(schema.shape)) {
		const values = formDataData[key];
		const tf = transformers?.[key];
		if (typeof tf === "function") {
			coercedData[key] = tf(formDataData[key], key, schema, formData);
		} else if (!values?.length) {
			coercedData[key] = handleEmptyField(schemaField);
		} else {
			coercedData[key] = coerce(values, schemaField);
		}
	}

	return schema.parse(coercedData);
}

function handleEmptyField(zodtype: ZodObjectType) {
	const defaultValue = getInnerZodObjectOfType(zodtype, z.ZodFirstPartyTypeKind.ZodDefault);
	if (defaultValue) {
		return defaultValue._def.defaultValue();
	}
	if (getInnerZodObjectOfType(zodtype, z.ZodFirstPartyTypeKind.ZodNullable)) {
		return null;
	}
	return undefined;
}

// @see https://github.com/colinhacks/zod/discussions/1763
function coerce(
	values: FormDataEntryValue[],
	schemaField: ZodObjectType
) {
	const sch = getInnerFirstPartyTypeKind(schemaField);
	if (sch === z.ZodFirstPartyTypeKind.ZodArray) {
		const type = getInnerFirstPartyTypeKind(schemaField._def.type);
		return values.map(i => coerceSimple(type, i));
	}
	return coerceSimple(sch, values[0]);
}

function getInnerZodObjectOfType(
	zodobj: ZodObjectType,
	...types: z.ZodFirstPartyTypeKind[]
): ZodObjectType | undefined {
	if (types.includes(zodobj?._def?.typeName)) {
		return zodobj;
	}
	if (zodobj?._def?.innerType) {
		return getInnerZodObjectOfType(zodobj._def.innerType, ...types);
	}
	return undefined;
}

function getInnerFirstPartyTypeKind(zodobj: ZodObjectType): z.ZodFirstPartyTypeKind {
	if (!zodobj?._def?.innerType?._def) {
		return zodobj?._def?.typeName;
	}
	return getInnerFirstPartyTypeKind(zodobj?._def?.innerType);
}

function coerceSimple(typeName: z.ZodFirstPartyTypeKind, value: unknown) {
	switch (typeName) {
		case z.ZodFirstPartyTypeKind.ZodNativeEnum:
		case z.ZodFirstPartyTypeKind.ZodNumber:
			return Number(value);
		case z.ZodFirstPartyTypeKind.ZodBoolean:
			return value === "on";
		default:
			return value;
	}
}