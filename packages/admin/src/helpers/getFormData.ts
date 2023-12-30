import z from "zod";
import type { FormValidationError } from "~/models/FormValidationError";

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

export type GetFormDataSuccess<T extends z.AnyZodObject> = [ data: z.infer<T>, error: undefined ];
export type GetFormDataError<T extends z.AnyZodObject> = [ data: undefined, error: FormValidationError<z.infer<T>> ];


export function getFormData<T extends z.AnyZodObject>(
	formData: FormData,
	schema: T,
	transformers?: FormDataTransformers<T>
): GetFormDataSuccess<T> | GetFormDataError<T> {
	const formDataData: Record<string, string[]> = {};
	for (const key of formData.keys()) {
		const values = formData.getAll(key).filter((i): i is string => typeof i === "string");
		formDataData[key] = values;
	}
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

	const result = schema.safeParse(coercedData);
	if (result.success) {
		return [result.data, undefined];
	} else {
		return [undefined, {
			...Object.fromEntries(formData) as Record<keyof z.infer<T>, string>,
			error: "Validation Error",
			details: result.error.flatten() 
		}];
	}
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