<script lang="ts">
	import { base } from "$app/paths";
	import type { ActionData } from "./$types";
	import { AuthorizationEnum, getAuthorizationStatusName } from "@shared/models/AuthorizationEnum";
	import type { PageData } from "./$types";
	import { getRoleName, UserRoleEnum } from "@shared/models/UserRoleEnum";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	export let data: PageData;
	export let form: ActionData;

	const user = {
		...data?.user,
		...form,
	};
</script>

<h2>Edit user</h2>

<BreadCrumbs cur="edit" href="{base}/users" name="Users" />

<form method="POST" action="?/edit">
	<p class="input-group">
		<label>
			Name
			<input name="name" type="text" value={user.name} autocomplete="username" />
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
		{#each Object.values(AuthorizationEnum) as status}
			<label>
				{getAuthorizationStatusName(status)}
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
		{#each Object.values(UserRoleEnum) as role}
			<label>
				{getRoleName(role)}
				<input name="role" type="radio" required value={role} checked={role == user.role} />
			</label>
		{/each}
	</fieldset>

	<button class="button">Save</button>
</form>

<form method="POST" action="?/resetPassword">
	<h3>Reset password</h3>

	<p class="input-group">
		<label>
			Password
			<input name="name" type="password" required />
			<small>
				{#if data?.user?.password}
					The user has a password. You can enter a new password, or submit an empty field to clear
					it.
				{:else}
					The user doesn't have a password. You can assign a password to the user using this input.
				{/if}
			</small>
		</label>
	</p>

	<button class="button">Update password</button>
</form>
