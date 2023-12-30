<script lang="ts">
	import { hasProperty } from "@shared/helpers/hasProperty";
	import { isResultErrorLike } from "@shared/models/Result";
	import { isValidationError } from "~/models/FormValidationError";
	import Panel from "./Panel.svelte";

	export let action: unknown | null;
</script>

{#if hasProperty(action, "error", "string")}
	<Panel style="error">
		<b>
			{#if hasProperty(action, "statusCode", "number")}
				{action.statusCode}
			{/if}
			{action.error}
		</b><br />

		{#if isValidationError(action) || isResultErrorLike(action)}
			<p><i>{action.message}</i></p>
			{#if action.details}
				<pre>{JSON.stringify(action.details, undefined, 4)}</pre>
			{/if}
		{/if}

	</Panel>
{:else if hasProperty(action, "success") && action.success === false}
	<Panel style="error">
		<b>Unknown Error</b><br />	
		<pre>{JSON.stringify(action, undefined, 4)}</pre>
	</Panel>
{/if}
