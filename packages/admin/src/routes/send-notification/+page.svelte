<script lang="ts">
	import type { ActionData, PageData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Panel from "~/components/Panel.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import { enhance } from "$app/forms";
	import Combobox from "~/components/Combobox.svelte";

	export let data: PageData;
	export let form: ActionData;
</script>

<h2>Send notification</h2>

<BreadCrumbs cur="Send notification" />

<ErrorPanel action={form} />

<form method="post" action="?/send" use:enhance>
	<div class="card card_form">
		<p class="input-group">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>
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
		{#if form?.success}
			<Panel style="success">
				Message sent
			</Panel>
		{/if}
		<button class="button">Send</button>
	</div>
</form>
