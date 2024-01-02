<script lang="ts">
	import { enhance } from "$app/forms";
	import ErrorPanel from "./ErrorPanel.svelte";
	import Panel from "./Panel.svelte";
	
	export let form: Record<string, unknown> | null | undefined;
	export let action = "?/import";
</script>
<details>
	<summary>Import configuration file</summary>
	<div class="details-body">
		<form use:enhance method="POST" {action} enctype="multipart/form-data">
			<input type="file" name="file" accept="application/json" required />
			<button>Upload</button>
			{#if form?.importError}
				<ErrorPanel action={form.importError} />
			{/if}
			{#if form?.importOk}
				<Panel>
					Configuration file imported. Edit the result as needed and click "Save"
				</Panel>
			{/if}
		</form>
	</div>
</details>