
<script lang="ts">
	import type { ServerConfig } from "@shared/models";
	import CryptoKeyInput from "./CryptoKeyInput.svelte";
	export let data: Partial<ServerConfig & { isDatabaseUrlOk?: boolean }> | undefined = undefined;
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
</style>