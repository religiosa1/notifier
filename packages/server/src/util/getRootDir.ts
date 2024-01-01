import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

/** Returns the rootDir */
export function getRootDir(): string {	
	if (process.env.NODE_ENV === "production") {
		// on prod env it's just the same dir, where bundle is situated
		return dirname(fileURLToPath(import.meta.url));
	} else {
		// on dev we're taking the closes dir with package.json file
		let path = fileURLToPath(import.meta.url);
		do {
			path = dirname(path);
			if (existsSync(join(path, "package.json"))) {
				return path;
			}
		} while(path);
		return dirname(fileURLToPath(import.meta.url));
	}
}
