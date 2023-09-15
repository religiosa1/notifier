<script lang="ts">
	import { jwtSecretRegex } from "@shared/models";
	import type { PageData, ActionData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";

	export let data: PageData;
	export let form: ActionData;

	let settings = {
		...data?.settings,
		...(form ?? {}),
	};

	async function generateJWTSecret() {
		const key = await crypto.subtle.generateKey(
			{ name: 'HMAC', hash: { name: 'SHA-256' } },
			true,
			['sign', 'verify']
		);
		const keyData = await crypto.subtle.exportKey('raw', key);
		const secret = btoa(String.fromCharCode(...new Uint8Array(keyData)));

		return secret;
	}

	let jwtInput: HTMLInputElement;
	async function handleGenerateClick() {
		jwtInput.value = await generateJWTSecret();
	}
</script>
<h2>App settings</h2>

<ErrorPanel action={form} />

{#if !data?.initialSetup}
<p>
	Your server hasn't been configured. You can do it right now.
</p>
<p>
	Please notice, that while you don't have any settings, the server doesn't
	ask for the authorization. After you create the settings you will have to login with the
	default credentials (admin:1234567). If something in your configuration
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
{/if}

<form method="POST">
	<div class="input-group">
		<label class="form-input">
			<span class="form-label">Bot token</span>
			<input
				name="botToken"
				placeholder="1234567890:AAFwr0hRwcnB_NqNnFiNJZFWS0AG9fyVBi8"
				value={settings.botToken ?? ""}
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

	<div class="input-group">
		<label class="form-input">
			<span class="form-label">Public url</span>
			<input
				type="url"
				name="publicUrl"
				placeholder="https://your_public.url/"
				value={settings.publicUrl ?? ""}
				required
			/>
			<small>
				This is your admin and API public url -- internet address.
			</small>
		</label>
	</div>

	<div class="input-group">
		<label class="form-input">
			<span class="form-label">Database url</span>
			<input
				name="databaseUrl"
				type="url"
				placeholder="postgres://default:pass@domain.work/db"
				value={settings.databaseUrl ?? ""}
				required
			/>
			<small>
				<a
					href="https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING"
					target="_blank"
					rel="noopener"
				>
					Database URL
				</a>, which should be accessible to your server.
			</small>
		</label>
	</div>

	<details>
		<summary>Danger zone</summary>
		<div class="details-body">
			<div class="input-group">
				<label class="form-input">
					<span class="form-label">Server API URL</span>
					<input
						name="apiUrl"
						type="url"
						placeholder="http://127.0.0.1:8085/"
						required
						value={settings.apiUrl ?? ""}
					/>
					<small>Address of your server, accessible to the Admin site</small>
				</label>
			</div>
			<div class="input-group">
				<label class="form-input">
					<span class="form-label">Server JWT secret</span>
					<input
						bind:this={jwtInput}
						name="jwtSecret"
						type="text"
						pattern={jwtSecretRegex.toString()}
						value={settings.jwtSecret ?? ""}
						required
					/>
					<button type="button" on:click={handleGenerateClick}>Generate</button>
					<small>
						This secret is used for signing JWT tokens on server. It has to be cryptograpgically sound.
						If you leave this field empty, it will be automatically generated.
					</small>
				</label>
			</div>
		</div>
	</details>
	<div class="input-group">
		<button class="button">Save</button>
	</div>
</form>

<style>
	details {
		margin-bottom: 1.5em;
	}
</style>
