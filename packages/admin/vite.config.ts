import "dotenv/config";
import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	envPrefix: [
		"VITE_",
		"API_URL",
	],
};

export default config;
