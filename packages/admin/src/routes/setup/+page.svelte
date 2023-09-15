<script lang="ts">
	import type { PageData, ActionData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import PasswordInput from "~/components/PasswordInput.svelte";
	import SettingsForm from "~/components/SettingsForm.svelte";

	export let data: PageData;
	export let form: ActionData;

	let settings = {
		...data?.settings,
		...(form ?? {}),
	};
</script>
<h2>Setup</h2>
<p>
	Your server hasn't been configured. You can do it right now.
</p>
<p>
	Please notice, that while you don't have any settings, the server doesn't
	ask for the authorization. You need to create an admin password. If something in your configuration
	(DB connection, public url, etc.) is wrong, you'll have to manually delete <code>config.current.json</code>
	file from the server and start all over again.
</p>
<p>
	You can edit <code>config.current.json</code> or <code>config.json</code> files directly, if you feel confident enough.
</p>
<p>
	If your server IS configured, but you still see this message, check that server has the required permissions to read
	<code>config.json</code> and ro read/write <code>config.current.json<code> in the root folder of the server.
</p>

<ErrorPanel action={settings} />

<form method="POST">

	<div class="input-group">
		<!-- This is bullshit: https://github.com/sveltejs/svelte/issues/5300 -->
		<label class="form-input" for={undefined}>
			<span class="form-label">Admin password</span>
			<PasswordInput
				name="botToken"
				placeholder="1234567890:AAFwr0hRwcnB_NqNnFiNJZFWS0AG9fyVBi8"
				value={settings?.password ?? ""}
				required
			/>
			<small>
				This is your notifier bot token as given by telegram's BotFather.<br />
				<a href="https://core.telegram.org/bots/tutorial#getting-ready" target="_blank" rel="noopener">
					How to create a telegram bot and get a bot token from BotFather?
				</a>
			</small>
		</label>
	</div>
	<SettingsForm data={settings} />
</form>
