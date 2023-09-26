<script lang="ts">
	import { enhance, applyAction  } from '$app/forms';
	import FormResultPanel from '~/components/FormResultPanel.svelte';
	import type { PageData, ActionData } from "./$types";
	import SettingsForm from "~/components/SettingsForm.svelte";

	export let data: PageData;
	export let form: ActionData;
	$: settings = {
		...data?.settings,
		...(form ?? {}),
	};
</script>
<h2>App settings</h2>

<form method="POST" action="?/save" use:enhance={
	() => ({ result }) => applyAction(result)
}>
	<FormResultPanel {form} />

	<div class="card card_form">
		<SettingsForm data={settings} />
		<div class="input-group">
			<button class="button">Save</button>
		</div>
	</div>
</form>
