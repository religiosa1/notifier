<script lang="ts">
	import type { PageData, ActionData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import SettingsForm from "~/components/SettingsForm.svelte";

	export let data: PageData;
	export let form: ActionData;

	let settings = {
		...data?.settings,
		...(form ?? {}),
	};
</script>
<h2>App settings</h2>

<ErrorPanel action={form} />

<form method="POST">
	<SettingsForm data={settings} />
</form>
