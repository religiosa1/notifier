<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import PasswordInput from "~/components/PasswordInput.svelte";
	import SettingsForm from "~/components/SettingsForm.svelte";

	export let data: PageData;
	export let form: ActionData;

	let migrate = true;

	let settings = {
		...data?.settings,
		...(form ?? {}),
	};
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

<ErrorPanel action={settings} />

<form method="POST" action="?/save" use:enhance>
	<SettingsForm data={settings} />
	<div class="input-group">
		<label class="form-input" for={undefined}>
			<span class="form-label">
				<input type="checkbox" name="migrate" bind:checked={migrate} />
				Migrate and seed database
			</span>
			<small>
				If this option is checked, the required database structure will be created
				and it will be populated with the necessary data. Uncheck it only if you
				know what you're doing.
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
				Your admin account password. It's 12342567 by default, you can change it now or later.
			</small>
		</label>
	</div>

	<div class="input-group">
		<button class="button">Save</button>
	</div>
</form>
