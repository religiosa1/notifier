
<script lang="ts">
	import type { ServerConfig } from "@shared/models";
	import Spinner from "./Spinner.svelte";
	import CryptoKeyInput from "./CryptoKeyInput.svelte";
	export let data: Partial<ServerConfig & { isDatabaseUrlOk?: boolean }> | undefined = undefined;
	export let testingDb = false;
</script>

<div class="input-group">
	<label class="form-input">
		<span class="form-label">Bot token</span>
		<input
			name="botToken"
			required
			placeholder="1234567890:AAFwr0hRwcnB_NqNnFiNJZFWS0AG9fyVBi8"
			value={data?.botToken ?? ""}
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
			This is your <em>backend</em> public url -- internet address.
			This is where the telegram bot webhook will be placed and where public REST-API 
			is accessible.
		</small>
	</label>
</div>

<div class="input-group">
	<label class="form-input">
		<span class="form-label">Database url</span>
		<input
			name="databaseUrl"
			type="url"
			placeholder="postgres://postgres:1234567@127.0.0.1:5432/postgres"
			value={data?.databaseUrl ?? "postgres://postgres:1234567@127.0.0.1:5432/postgres"}
			required
		/>
		<p>
			<button type="submit" class="secondary" formnovalidate formaction="?/testDbConfiguration">
				Test provided DB configuration
			</button>
			{#if testingDb}
				<Spinner />
			{/if}
			{#if data?.isDatabaseUrlOk === true}
				<output>Database URL is ok</output>
			{:else if data?.isDatabaseUrlOk === false}
				<output class="error">Can't connect using provided URL</output>
			{/if}
		</p>
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
	<summary>Advanced</summary>
	<div class="details-body">
		<div class="input-group">
			<label class="form-input" for={undefined}>
				<span class="form-label">Server JWT secret</span>
				<CryptoKeyInput 
					value={data?.jwtSecret ?? ""}
					name="jwtSecret"
					required
				/>
				<small>
					This secret is used for signing JWT tokens on server. It has to be cryptograpgically sound.<br />
					Making this change will require all users to log in again!
				</small>
			</label>
		</div>
		<div class="input-group">
			<label class="form-input" for={undefined}>
				<span class="form-label">Telegram Webhook secret</span>
				<CryptoKeyInput 
					value={data?.tgHookSecret ?? ""}
					name="tgHookSecret"
					base32
					length={512}
					required
				/>
				<small>
					This secret is used to ensure that incomming WebHook messages are comming from Telegram.
				</small>
			</label>
		</div>
	</div>
</details>

<style>
details {
	margin-bottom: 1.5em;
}
.error {
	color: var(--clr-error, red);
}
</style>