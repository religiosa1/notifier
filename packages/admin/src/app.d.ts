// See https://kit.svelte.dev/docs/types#app

import type { TokenPayload } from "@shared/models/TokenPayload";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: TokenPayload;
			isBackendInitialized: boolean;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
