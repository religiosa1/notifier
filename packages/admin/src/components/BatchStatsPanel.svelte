<script lang="ts">
	import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
	import { hasField } from "~/helpers/hasField";
	import Panel from "./Panel.svelte";
	export let action: BatchOperationStats | unknown | null;
	export let verb = "Deleted";
	export let entityName = "items";

	function isBatchOperationStats(e: unknown): e is BatchOperationStats {
		return hasField(e, "count", "number") && hasField(e, "outOf", "number");
	}
</script>

{#if isBatchOperationStats(action) && action?.outOf}
	<Panel style={action.count < action.outOf || !action.count ? "error" : undefined}>
		{#if action.count === 1 && action.outOf === 1}
			Succefully {verb.toLowerCase()} requested item.
		{:else if action.count > 0}
			{verb}
			{action.count} out of {action.outOf} requested {entityName}
			{#if action.count < action.outOf}
				<p class="error">
					Error ocured with {action.outOf - action.count}
					{entityName}
				</p>
			{/if}
		{:else}
			<p class="error">None of the {entityName} was {verb}</p>
		{/if}
	</Panel>
{/if}
