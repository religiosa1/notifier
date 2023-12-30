<script lang="ts">
	import { page } from '$app/stores';
	import Panel from '~/components/Panel.svelte';
	import { isResultErrorLike } from '@shared/models/Result';
	import { attempt } from '@shared/helpers/attempt';
	import { hasProperty } from '@shared/helpers/hasProperty';

	$: details = extractDetaild($page.error?.message);
	$: console.log($page.error);

	function extractDetaild(error: unknown) {
		if (typeof error !== "string") {
			return;
		}
		const [details] = attempt(() => JSON.parse(error));
		if (hasProperty(details, "body") && isResultErrorLike(details.body)) {
			return details.body;
		}
		return;
	}
</script>

<h1>{$page.status}: {details?.error ?? $page.error?.message}</h1>
<p>{$page.url}</p>
<Panel style="error">
	<pre>{JSON.stringify(details ?? $page.error, undefined, 2)}</pre>
</Panel>