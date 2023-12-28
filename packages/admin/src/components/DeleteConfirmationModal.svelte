<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { applyAction, deserialize } from "$app/forms";
	import type { ActionResult } from "@sveltejs/kit";

	import Modal from "~/components/Modal.svelte";

	export let open: boolean;
	export let selected: Set<number>;
	export let action = "?/delete";

	async function handleConfirmationClick() {
		open = false;
		const formData = new FormData();
		selected.forEach((i) => formData.append("id", i.toString()));
		const response = await fetch(action, {
			method: "POST",
			body: formData,
		});
		const result: ActionResult = deserialize(await response.text());
		await invalidateAll();
		selected = new Set();
		applyAction(result);
	}
</script>

<Modal bind:open let:close>
	<p>You're about to irreversibly delete those entries.</p>
	<p>Are you sure?</p>
	<p>
		<button type="button" class="danger" on:click={handleConfirmationClick}> Yes </button>
		<button type="button" class="secondary" on:click={close}> No </button>
	</p>
</Modal>
