import { format } from "util";

/**
 * Tagged template helper for formatting each value passed to the string
 */
export function esc(strings: TemplateStringsArray, ...exps: Array<string | number | boolean>): string {
	let result = "";
	for (let i = 0; i < strings.length; i++) {
		result += strings[i];
		if (i < exps.length) {
			result += format("%o", exps[i]);
		}
	}
	return result;
}
