import { resolve } from "node:path";
import { defineConfig } from 'vitest/config'
import { getRootDir } from "./src/util/getRootDir";

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: [
			{ find: "@shared", replacement: resolve(getRootDir(), "../shared/src") }
		]
	},
});