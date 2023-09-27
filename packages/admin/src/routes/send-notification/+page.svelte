<script lang="ts">
	import type { ActionData, PageData } from "./$types";
	import FormResultPanel from "~/components/FormResultPanel.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import { enhance } from "$app/forms";
	import Combobox from "~/components/Combobox.svelte";

	export let data: PageData;
	export let form: ActionData;
</script>

<h2>Send notification</h2>

<BreadCrumbs cur="Send notification" />

<FormResultPanel {form} />

<form method="post" action="?/send" use:enhance>
	<div class="card card_form">
		<p class="input-group">
			<label for={undefined}>
				<span class="form-label">Channels</span>
				<Combobox
					name="channels"
					value={form?.channels ?? ""}
					items={data.channels?.map(i => i.name)}
				/>
				<small>Whitespace or comma-separated</small>
			</label>
		</p>
		<p class="input-group">
			<label>
				<span class="form-label">Message</span>
				<textarea name="message" value={form?.message ?? ""} required />
			</label>
		</p>
		<button class="button">Send</button>
	</div>
</form>
