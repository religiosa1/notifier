
<script lang="ts">
	import { jwtSecretRegex, type SettingsFormData } from "@shared/models";
	export let data: Partial<SettingsFormData> | undefined = undefined;

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

<div class="input-group">
	<label class="form-input">
		<span class="form-label">Bot token</span>
		<input
			name="botToken"
			placeholder="1234567890:AAFwr0hRwcnB_NqNnFiNJZFWS0AG9fyVBi8"
			value={data?.botToken ?? ""}
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
			value={data?.publicUrl ?? ""}
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
			value={data?.databaseUrl ?? ""}
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
					value={data?.apiUrl ?? ""}
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
					value={data?.jwtSecret ?? ""}
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

<style>
details {
	margin-bottom: 1.5em;
}
</style>