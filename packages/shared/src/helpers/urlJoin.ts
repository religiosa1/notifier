export function urlJoin(...components: string[]): string {
	if (!components.length) {
		return "";
	}
	let retval = components[0]!;
	for (let i = 1; i < components.length; i++) {
		const current = components[i];
		const previous = components[i - 1];
		const hasTrailingSlash = !!previous?.endsWith("/");
		const hasLeadingSlash = !!current?.startsWith("/");
		if (hasLeadingSlash && hasTrailingSlash) {
			retval += current?.substring(1);
		} else if (!hasLeadingSlash && !hasTrailingSlash) {
			retval += "/" + current;
		} else {
			retval += current;
		}	
	}
	return retval;
}