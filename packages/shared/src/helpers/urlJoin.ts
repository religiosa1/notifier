export function urlJoin(a: string, b: string): string {
	if (a.endsWith("/") && b.startsWith("/")) {
		return a + b.slice(1);
	}
	if (!a.endsWith("/") && !b.endsWith("/")) {
		return a + "/" + b;
	}
	return a + b;
}