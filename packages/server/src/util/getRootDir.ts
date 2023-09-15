import { dirname } from "path";
import { fileURLToPath } from "url";

export function getRootDir(): string {
	const path = fileURLToPath(import.meta.url);
	// We're cutting 3 times, as we're in src/util/getRootDir.ts. If we move this filem code should change.
	const dir = dirname(dirname(dirname(path)));
	return dir;
}
