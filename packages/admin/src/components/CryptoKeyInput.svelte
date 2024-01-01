<script lang="ts">
	import { generateSecretKey } from "~/helpers/generateSecretKey";

	export let required = false;
	export let value: string;
	export let name: string | undefined = undefined;
	export let base32 = false;
	export let length: number | undefined = undefined;

	let input: HTMLTextAreaElement;

	async function handleGenerateClick() {
		input.value = await generateSecretKey(base32 ? "base32" : "base64", length);
	}
	
	// pattern={`[A-Za-z0-9+\\/]+={0,2}`}	
</script>
<textarea
	rows={4}
	bind:this={input}
	{name}
	{value}
	{required}
/>
<button type="button" on:click={handleGenerateClick}>Generate</button>

<style>
	textarea {
		display: block;
		box-sizing: border-box;
		width: 100%;
		resize: vertical;
		margin: 5px 0 10px;
	}
</style>