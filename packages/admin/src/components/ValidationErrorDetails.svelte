<script lang="ts">
	import type zod from "zod";
	export let error: zod.typeToFlattenedError<Record<string, unknown>>;
</script>

<dl>
	{#if error?.formErrors.length}
	<div>
		<dt>Form Errors:</dt>
		<dd>
			{#each error?.formErrors as msg}
				{msg}<br />
			{/each}
		</dd>
	</div>
	{/if}
	<!-- TODO: display right next to the problematic field  -->
	{#each Object.entries(error?.fieldErrors) as [key, msgs]}
		<div>
			<dt>{key}</dt>
			<dd>
				{#each msgs ?? [] as msg}
					{msg}<br />
				{/each}
			</dd>
		</div>
	{/each}
</dl>

<style>
	dt::after {
		content: ":"
	}
</style>