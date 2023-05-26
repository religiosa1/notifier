<script lang="ts">
	import type { Group } from "@shared/models/Group";

	export let groups: Group[] | undefined;

	const sliceSize = 10;
	$: slice = groups?.slice(0, sliceSize) ?? [];
	$: groupText = slice.map(i => i.name).join(", ");
	$: remainder = Math.min(groups?.length ?? 0 - 10, 0);
</script>

<span class="groups-preview">
	{#each slice as group (group.id)}
		{groupText}
	{/each}
	{#if remainder}
		<i>and {remainder} more.</i>
	{/if}
</span>
