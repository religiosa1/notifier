import type { Actions } from "./$types";
import { unwrapResult, handleActionFailure } from "~/helpers/unwrapResult";
import { channelNameSchema } from "@shared/models/Channel";
import { serverUrl } from "~/helpers/serverUrl";

export const actions: Actions = {
	async send({ fetch, request }) {
		const formData = await request.formData();
		const message = formData.get("message")?.toString();
		const channels = formData.get("channels")?.toString()
			?.split(/(?:\s*,\s*)|(?:\s+)/)
			.map(i => channelNameSchema.parse(i.trim()));
		try {
			await fetch(serverUrl("/notify"), {
				method: "POST",
				body: JSON.stringify({ channels, message }),
			}).then(unwrapResult);
			return { success: true }
		} catch (err) {
			return handleActionFailure(err, { message, channels: channels?.join(", ") });
		}
	}
}