<script lang="ts">
	import { hasProperty } from "@shared/helpers/hasProperty";
	import Panel from "./Panel.svelte";
	import ErrorPanel from "./ErrorPanel.svelte";

	export let form: unknown | null;

</script>

{#if hasProperty(form, "error", "string") || (hasProperty(form, "success") && form.success === false)}
	<ErrorPanel action={form} />
{/if}
{#if hasProperty(form, "success") && form.success === true}
	<Panel style="success">
		<slot>Success!</slot>
	</Panel>
{/if}