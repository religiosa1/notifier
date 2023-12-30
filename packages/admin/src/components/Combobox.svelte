<script lang="ts">
	import { nanoid } from "nanoid";
	export let value: string | undefined;
	export let name: string | undefined;
	export let items: string[];
	export let required = false;

	const dataListId = nanoid();

	let options: string[] = [];

	$: {
		if (/[\s,]+$/.test(value ?? "")) {
			const currentItems = value?.split(/[\s,]+/) || [];
			options = items.filter(i => !currentItems.includes(i)).map(i => value + i);
		} else {
			options = items;
		}
	}

</script>

<input
	type="text"
	autocomplete="off"
	bind:value={value}
	list={dataListId}
	{required}
	{name}
/>
<datalist id={dataListId}>
	{#each options as value}
		<option {value} />
	{/each}
</datalist>