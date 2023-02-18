<script lang="ts">
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import type { ActionData, PageData } from "./$types";
	export let data: PageData;
	export let form: ActionData;

	let selectedUsers = new Set<number>();

	function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		const formData = new FormData();
		selectedUsers.forEach(i => formData.append("id", i.toString()));
		// FIXME custom modal for that purpose instead of blocking confirm calls
		if (confirm("You're about to irreversibly delete the following user. Are you sure?")) {
		  e.currentTarget.submit();
		}
	}

	function toggleCurrent() {
		if (data.users.every(i => selectedUsers.has(i.id))) {
			data.users.forEach(i => selectedUsers.delete(i.id));
			selectedUsers = new Set(selectedUsers);
		} else {
			data.users.forEach(i => selectedUsers.add(i.id));
			selectedUsers = new Set(selectedUsers);
		}
	}
</script>

<h2>Users</h2>

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				<th>Telegram ID</th>
				<th>Authorization Status</th>
				<th>Is admin?</th>
				<th>Groups</th>
				<th>
					<button type="button" title="select/deselect" on:click={toggleCurrent}/>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user (user.id)}
				{@const link = `${$page.url.href}/${encodeURIComponent(user.id)}/`}
				<tr>
					<td><a href={link}>{user.name}</a></td>
					<td>{user.telegramId}</td>
					<td>{user.authorizationStatus}</td>
					<td>{!!user.password}</td>
					<td>
						{#each user.groups.slice(0, 10) as group (group.id)}
							{group.name}
						{/each}
						{#if user.groups.length > 10}
							{user.groups.length - 10} more.
						{/if}
					</td>
					<td>
						<input
							type="checkbox"
							value={user.id}
							name="id"
							checked={selectedUsers.has(user.id)}
							on:change={(e) => {
									if (e.currentTarget.checked) {
										selectedUsers = new Set(selectedUsers.add(user.id));
									} else if (selectedUsers.delete(user.id)) {
										selectedUsers = new Set(selectedUsers);
									}
							}}
						/>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6">No user is present in the response!</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if selectedUsers.size > 0}
		Selected {selectedUsers.size} elements. <button on:click={() => selectedUsers = new Set()} type="button">deselect all</button>
	{/if}

	<Pagination {...data.pagination} />

	<div class="form-controls">
		<a class="button" href="{base}/users/new"> Add a new user </a>
		<button>Delete selected</button>
	</div>
</form>
