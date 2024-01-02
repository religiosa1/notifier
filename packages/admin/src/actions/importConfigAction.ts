import { attempt } from "@shared/helpers/attempt";
import { serverConfigSchema } from "@shared/models";
import { fail, type Action } from "@sveltejs/kit";
import { makeValidationError } from "~/models/FormValidationError";

export const importConfigAction: Action = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get("file");
	if (!file || typeof file === "string") {
		return fail(422, { importError: { error: "No file provided"} });
	}
	const contents = await file.text();
	const [data, jsonParseError] = attempt(() => JSON.parse(contents));
	if (jsonParseError) {
		return fail(422, { importError: { error: "Cannot parse the provided file as JSON"} });
	}
	const result = serverConfigSchema.safeParse(data);
	if (!result.success) {
		return fail(422, { importError: makeValidationError(result.error.flatten()) });
	}
	return {importOk: true, ...result.data};
};