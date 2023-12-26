<script>
	import { page } from '$app/stores';
	import Panel from '~/components/Panel.svelte';
</script>

<h1>{$page.status}: {$page.error?.message}</h1>

<Panel style="error">
	<pre>{JSON.stringify($page.error, undefined, 2)}</pre>
</Panel>