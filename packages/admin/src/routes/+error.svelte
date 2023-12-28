<script lang="ts">
	import { page } from '$app/stores';
	import Panel from '~/components/Panel.svelte';
	import { isResultErrorLike } from '~/models/Result';

	$: details = extractDetaild($page.error?.message);
	$: console.log($page.error);

	function extractDetaild(error: unknown) {
		if (typeof error !== "string") {
			return;
		}
		try {
			const details = JSON.parse(error);
			if (details.body && typeof details.body === "object" && isResultErrorLike(details.body)) {
				return details.body;
			}
		} catch {
			return;
		}
	}
</script>

<h1>{$page.status}: {details?.error ?? $page.error?.message}</h1>
<p>{$page.url}</p>
<Panel style="error">
	<pre>{JSON.stringify(details ?? $page.error, undefined, 2)}</pre>
</Panel>