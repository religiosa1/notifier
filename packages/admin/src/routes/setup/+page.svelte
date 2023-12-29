<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import type { PageData, ActionData } from "./$types";
	import FormResultPanel from '~/components/FormResultPanel.svelte';
	import PasswordInput from "~/components/PasswordInput.svelte";
	import SettingsForm from "~/components/SettingsForm.svelte";
	import Spinner from '~/components/Spinner.svelte';

	export let data: PageData;
	export let form: ActionData;	

	$: settings = {
		...data?.settings,
		...(form ?? {}),
	};

	let submitingAction: "testDb" | "default" | undefined;

	let migrate = true
</script>

<h2>Setup</h2>
<p>
	Your server hasn't been configured yet. You can do it right now.
</p>
<p>
	Please notice, that while you don't have any settings, the server doesn't
	ask for the authorization. You need to create an admin password. If something in your configuration
	(DB connection, public url, etc.) is wrong, you'll have to manually delete <code>config.json</code>
	file from the server and start all over again.
</p>
<p>
	You can edit <code>config.json</code> file directly, if you feel confident enough.
</p>
<p>
	If your server IS configured, but you still see this message, check that server has the required permissions to read
	<code>config.json</code> in the root folder of the server.
</p>

<FormResultPanel {form} />
<form method="POST" action="?/save" use:enhance={
	({action}) => {
		submitingAction = action.search.includes("testDbConfiguration") ? "testDb" : "default";
		return ({ result }) => {
			submitingAction = undefined;
			applyAction(result);
		}
	}
}>
	<SettingsForm testingDb={submitingAction === "testDb"} data={settings} />
	<div class="input-group">
		<label class="form-input" for={undefined}>
			<span class="form-label">
				<input type="checkbox" name="migrate" bind:checked={migrate} />
				Migrate and seed database
			</span>
			<small>
				If this option is checked, the required database structure will be created
				and it will be populated with the necessary data. <br />
				Uncheck it only if you have previous notifier DB initialized and you know what you're doing.
			</small>
		</label>
	</div>

	<div class="input-group">
		<label class="form-input" for={undefined}>
			<span class="form-label">Admin password</span>
			<PasswordInput
				disabled={!migrate}
				name="password"
				autocomplete="new-password"
				required={migrate}
				value="1234567"
			/>
			<small>
				Your admin account password that will be used during the migration. <br />
				It's 12342567 by default, you can change it now or later.
			</small>
		</label>
	</div>

	<div class="input-group">
		<label class="form-input">
			<span class="form-label">Admin telegram ID</span>
			<input
				name="telegramId"
				type="text"
				pattern="\d+"
				value={settings.telegramId ?? ""}
			/>
			<small>
				Your admin account <em>numeric</em> telegramId that will be used during the migration. <br />
				You can find out your telegramId using 
				<a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a> 
				or by running the hidden command <code>/get_id</code> if notifier bot is already running.
			</small>
		</label>
	</div>

	<div class="input-group">
		<button disabled={!!submitingAction} class="button">Save</button>
		{#if submitingAction === "default"}
			<Spinner />
		{/if}
	</div>
</form>
