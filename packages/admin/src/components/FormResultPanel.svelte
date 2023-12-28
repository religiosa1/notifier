<script lang="ts">
	import { hasField } from "~/helpers/hasField";
	import type { ActionValidationError } from "~/helpers/unwrapResult";
	import Panel from "./Panel.svelte";

	export let form: unknown | null;

	function isValidationError(e: unknown): e is ActionValidationError {
		return !!(hasField(e, "error") && e.error === "Validation error");
	}
</script>

{#if hasField(form, "error", "string")}
	<Panel style="error">
		{form.error}
		{#if isValidationError(form)}
			{#each form.errorDetails.allErrors as err}
				<pre>{err.path}:{#if "validation" in err} ({err.validation}) {/if}: {err.message}</pre>
			{/each}
		{:else if hasField(form, "errorDetails", "string")}
			<pre>{form.errorDetails}</pre>
		{/if}
	</Panel>
{/if}
{#if hasField(form, "success", "boolean")}
	<Panel style="success">
		<slot>Success!</slot>
	</Panel>
{/if}