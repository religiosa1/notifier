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

<div class="edit-grid">
	<form method="POST" action="?/edit">
		<div class="card card_form">
			<p class="input-group">
				<label>
					<span class="form-label">Name</span>
					<input name="name" type="text" value={user.name} autocomplete="username" />
				</label>
			</p>
			<p class="input-group">
				<label>
					<span class="form-label">Telegram Id</span>
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
		</div>
	</form>

	<form method="POST" action="?/resetPassword">
		<div class="card card_form">
			<h3>Reset password</h3>

			<p class="input-group">
				<label>
					<span class="form-label">Password</span>
					<input name="name" type="password" required />
					<small>
						{#if data?.user?.password}
							The user has a password. You can enter a new password, or submit an empty field to clear
							it.
						{:else}
							The user doesn't have a password. You can assign a password to the user using this
							input.
						{/if}
					</small>
				</label>
			</p>

			<button class="button">Update password</button>
		</div>
	</form>
</div>

<style>
	.edit-grid {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		grid-gap: 1rem;
	}
</style>