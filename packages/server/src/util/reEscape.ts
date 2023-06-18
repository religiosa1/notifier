/** Replacer for escaping regular expressions string from string input */

export function reEscape(str: string): string
export function reEscape(strings: TemplateStringsArray, ...exps: Array<unknown>): string;
export function reEscape(stringsOrString: TemplateStringsArray | string, ...exps: Array<unknown>): string {
	let str: string = "";
	if (typeof stringsOrString === "string") {
		str = stringsOrString;
	} else {
		for (let i = 0; i < stringsOrString.length; i++) {
			str += stringsOrString[i];
			if (i < exps.length) {
				str += exps[i];
			}
		}
	}
	return str.replace(/[|\\\/{}()[\]^$+*?.]/g, '\\$&');
};
