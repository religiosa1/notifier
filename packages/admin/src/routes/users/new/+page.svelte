<script lang="ts">
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
	import { userSchema } from "@shared/models/User";
	import { UserRoleEnum } from "@shared/models/UserRoleEnum";
	import type { User } from "@shared/models/User";
	import type { ActionData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Panel from "~/components/Panel.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";

	const userShape = Object.fromEntries(Object.keys(userSchema.shape).map((k) => [k, ""])) as Record<
		keyof User,
		unknown
	>;

	export let form: ActionData;

	const user = {
		...userShape,
		...form,
	};
</script>

<h2>Create a new user</h2>

<BreadCrumbs cur="create" href="/users" name="Users" />

<p>Attention! That's not a part of a normal user flow!</p>
<p>
	Your user should use /start command in telegram bot. Here you have to enter telegramId manually.
	It's not the same as telegram user handle, it's an id. I hope you know what you're doing.
</p>

{#if form?.createdUser}
	<Panel
		>Successfully created a new user
		<code
			>{"{"} id: {form.createdUser?.id}, name: "<a href="{base}/users/{form.createdUser.id}"
				>{form.createdUser?.name}</a
			>"
			{"}"}</code
		></Panel
	>
{/if}
<ErrorPanel action={form} />

<form method="POST" action="?/create" use:enhance>
	<p class="input-group">
		<label>
			Name
			<input name="name" type="text" value={user.name} autocomplete="username" />
			{#if form?.error === "Validation error" && form.errorDetails.fields.name}
				<p class="error">
					{form.errorDetails.fields.name.message}
				</p>
			{/if}
		</label>
	</p>
	<p class="input-group">
		<label>
			Telegram Id
			<input name="telegramId" type="text" value={user.telegramId} required />
		</label>
	</p>
	<fieldset class="input-group">
		<legend>Authorizarion status</legend>
		{#each Object.entries(AuthorizationEnum) as [statusName, status]}
			<label>
				{statusName}
				<input
					name="authorizationStatus"
					type="radio"
					required
					value={status}
					checked={status == user.authorizationStatus}
				/>
			</label>
		{/each}
	</fieldset>
	<fieldset class="input-group">
		<legend>User role</legend>
		{#each Object.entries(UserRoleEnum) as [roleName, status]}
			<label>
				{roleName}
				<input name="role" type="radio" required value={status} checked={status == user.role} />
			</label>
		{/each}
	</fieldset>
	<p class="input-group">
		<label>
			Password
			<input name="password" type="password" autocomplete="new-password" />
		</label>
	</p>

	<button class="button">Create</button>
	<button class="button" formaction="?/create&addNew">Create and add another</button>
</form>
