<script lang="ts">
	import { enhance, applyAction  } from '$app/forms';
	import FormResultPanel from '~/components/FormResultPanel.svelte';
	import type { PageData, ActionData } from "./$types";
	import SettingsForm from "~/components/SettingsForm.svelte";
	import BreadCrumbs from '~/components/BreadCrumbs.svelte';
	import ImportConfigForm from '~/components/ImportConfigForm.svelte';

	export let data: PageData;
	export let form: ActionData;
	$: settings = {
		...data?.settings,
		...(form ?? {}),
	};
</script>
<h2>App settings</h2>

<BreadCrumbs cur="App settings" />

<FormResultPanel {form} />

<form method="POST" action="?/save" use:enhance={
	() => ({ result }) => applyAction(result)
}>
	<div class="card card_form">
		<SettingsForm data={settings} />
		<div class="input-group">
			<button class="button">Save</button>
			<a class="button" href="/settings/export" download="config.json">Export settings</a>
		</div>
	</div>
</form>

<ImportConfigForm {form} />