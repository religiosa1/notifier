<script lang="ts">
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";
	import { AuthorizationEnum, getAuthorizationStatusName } from "@shared/models/AuthorizationEnum";
	import type { PageData } from "./$types";
	import { getRoleName, UserRoleEnum } from "@shared/models/UserRoleEnum";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";

	export let data: PageData;
	export let form: ActionData;

	const user = {
		...data?.user,
		...form,
	};
</script>

<h2>Edit user</h2>

<BreadCrumbs cur="edit" href="{base}/users" name="Users" />
<ErrorPanel action={form} />

<div class="edit-grid">
	<div class="card card_vw">
		<form method="POST" action="?/edit">
			<h3>Main data</h3>
			<p class="input-group">
				<label>
					<span class="form-label">Name</span>
					<input required name="name" type="text" value={user.name} autocomplete="username" />
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
		</form>
	</div>

	<div class="card card_vw">
		<form method="POST" action="?/resetPassword" use:enhance>

			<h3>Change admin password</h3>

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
		</form>
	</div>
</div>

<!-- FIXME need to achieve scoping in error handling here,  -->
<!-- <ErrorPanel action={form?.groups} /> -->
<div class="card">
	<div class="user-groups">
		<h3>Groups</h3>
		<ul>
			{#each (data?.user?.groups || []) as group (group.id)}
				<li>
					<form method="POST" action="?/deleteGroup" use:enhance>
						<input type="hidden" name="id" value={group.id} />
						<a href="{base}/groups/{group.id}">{group.name}</a>
						<button>Delete</button>
					</form>
				</li>
			{:else}
			<li>
				This user has no groups &mdash; he can't recieve notifications
			</li>
			{/each}
		</ul>
		{#if (data?.user?.groups?.length ?? 0) > 1}
			<form method="POST" action="?/deleteAllGroups" use:enhance>
				<p>
					<button>Delete all groups</button>
				</p>
			</form>
		{/if}
		<form method="POST" action="?/addOrCreateGroup" use:enhance>
			<p>
				<input required name="name" autocomplete="off" list="available-groups" />
				<datalist id="available-groups">
					{#each data.groups as group}
						<option value={group.name} />
					{/each}
				</datalist>
				<button>Add group</button>
			</p>
		</form>
	</div>
</div>

<nav>
	<a href="{base}/users/{user.id}/api-keys">API keys</a>
	<a href="{base}/users/{user.id}/channels">Notification channels</a>
</nav>

<style>
	@media (min-width: 820px) {
		.edit-grid {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			grid-gap: 1rem;
			align-content: stretch;
			justify-content: stretch;
		}
	}

</style>