<script lang="ts">
	import { nanoid } from "nanoid";
	export let value: string | undefined;
	export let name: string | undefined;
	export let items: string[];

	const dataListId = nanoid();

	$: options = getAvailableOptions(value ?? "");

	function getAvailableOptions(value: string): string[] {
		if (/[\s,]+$/.test(value)) {
			const currentItems = value.split(/[\s,]+/);
			return items.filter(i => !currentItems.includes(i)).map(i => value + i);
		}
		return items
	}
</script>

<input
	type="text"
	autocomplete="off"
	bind:value={value}
	list={dataListId}
	{name}
/>
<datalist id={dataListId}>
	{#each options as value}
		<option {value} />
	{/each}
</datalist>