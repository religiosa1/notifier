import { isResultErrorLike, type Result } from "@shared/models";
import { error, type NumericRange } from "@sveltejs/kit";

export function unwrapResult<T>(r: Response): Promise<T> {
	return r.json().then((data: Result<T>) => {
		if (isResultErrorLike(data)) {
			error(data.statusCode as NumericRange<400,599>, data);
		}
		if (!r.ok) {
			const err = {
				message: r.statusText,
				...(typeof data === "object" ? data : { data: JSON.stringify(data) })
			};
			error(r.status as NumericRange<400,599>, err);
		}
		return data?.data;
	});
}