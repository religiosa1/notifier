<script lang="ts">
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import { AuthorizationEnum, getAuthorizationStatusName } from "@shared/models/AuthorizationEnum";
	import { getRoleName, UserRoleEnum } from "@shared/models/UserRoleEnum";
	import type { ActionData, PageData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Panel from "~/components/Panel.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import Combobox from "~/components/Combobox.svelte";
	import { TELEGRAM_MAX_ID } from "~/constants";

	export let data: PageData;
	export let form: ActionData;
</script>

<h2>Create a new user</h2>

<BreadCrumbs cur="create" href="/users" name="Users" />

<p>Attention! That's not a part of a normal user flow!</p>
<p>
	Your user should use /start command in telegram bot. Here you have to enter telegramId manually.
	It's not the same as telegram user handle, it's an id. I hope you know what you're doing.
</p>

{#if form?.createdUser}
	<Panel>
		Successfully created a new user
		<code>
			{"{"}
				id: {form.createdUser?.id},
				name: "<a href="{base}/users/{form.createdUser.id}">{form.createdUser?.name}</a>"
			{"}"}
		</code>
	</Panel>
{/if}

<ErrorPanel action={form} />

<form method="POST" action="?/create" use:enhance>
	<div class="card card_form">
		<p class="input-group">
			<label class="form-input">
				<span class="form-label">Name</span>
				<input name="name" type="text" value={form?.name ?? ""} autocomplete="off" />
				{#if typeof form?.errorDetails === "object"}
					<p class="error">
						{form.errorDetails.fields.name?.message}
					</p>
				{/if}
			</label>
		</p>
		<p class="input-group">
			<label class="form-input">
				<span class="form-label">Telegram Id</span>
				<input
					name="telegramId"
					autocomplete="off"
					type="number"
					step={1}
					max={TELEGRAM_MAX_ID}
					value={form?.telegramId ?? ""}
					required
				/>
			</label>
		</p>
		<fieldset class="input-group">
			<legend>Authorizarion status</legend>
			{#each Object.values(AuthorizationEnum) as status}
				<label class="form-input">
					{getAuthorizationStatusName(status)}
					<input
						name="authorizationStatus"
						autocomplete="off"
						type="radio"
						required
						value={status}
						checked={status == (form?.authorizationStatus || 0)}
					/>
				</label>
			{/each}
		</fieldset>
		<fieldset class="input-group">
			<legend>User role</legend>
			{#each Object.values(UserRoleEnum) as role}
				<label>
					{getRoleName(role)}
					<input
						name="role"
						type="radio"
						autocomplete="off"
						required
						value={role}
						checked={role == (form?.role || 0)}
					/>
				</label>
			{/each}
		</fieldset>
		<p class="input-group">
			<label class="form-input">
				<span class="form-label">Password</span>
				<input name="password" type="password" autocomplete="off" />
			</label>
		</p>

		<p class="input-group">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>
				<span class="form-label">Groups</span>
				<Combobox
					name="groups"
					value={form?.groups ?? ""}
					items={data.groups.map(i => i.name)}
				/>
				<small>Whitespace or comma-separated</small>
			</label>
		</p>

		<button class="button">Create</button>
		<button class="button" formaction="?/create&addNew">
			Create and add another
		</button>
	</div>
</form>
