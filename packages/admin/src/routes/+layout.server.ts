import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// We have to manually track user updates after login or logout calls,
	// as page load and layout load run concurrently and we can't be really sure what finished first
	// Which results in stale user panel.
	depends("app:user");
	const { user } = locals;
	return { user };
}