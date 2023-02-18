/**
 * Tagged template helper for encoding each passed expression as uri component.
 */
export function uri(strings: TemplateStringsArray, ...exps: Array<string | number | boolean>): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < exps.length) {
      result += encodeURIComponent(exps[i]);
    }
  }
  return result;
}
