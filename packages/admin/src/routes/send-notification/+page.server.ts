import type { Actions } from "./$types";
import { server_base } from "~/constants";
import { unwrapResult, handleActionFailure } from "~/helpers/unwrapResult";
import { channelNameSchema } from "@shared/models/Channel";

export const actions: Actions = {
	async send({ fetch, request }) {
		const formData = await request.formData();
		const message = formData.get("message")?.toString();
		const channels = formData.get("channels")?.toString()
			?.split(/(?:\s*,\s*)|(?:\s+)/)
			.map(i => channelNameSchema.parse(i.trim()));
		try {
			await fetch(new URL("/notify", server_base), {
				method: "POST",
				body: JSON.stringify({ channels, message }),
			}).then(unwrapResult);
			return { success: true }
		} catch (err) {
			return handleActionFailure(err, { message, channels: channels?.join(", ") });
		}
	}
}