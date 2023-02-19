<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { applyAction, deserialize } from "$app/forms";
	import { base } from "$app/paths";
	import type { ActionData, PageData } from "./$types";
	import { uri } from "~/helpers/uri";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import Modal from "~/components/Modal.svelte";
	import type { ActionResult } from "@sveltejs/kit";
	import { tristate } from "~/helpers/tristate";
	export let data: PageData;
	export let form: ActionData;

	let selectedUsers = new Set<number>();
	let showConfirmation = false;

	$: availableUsers = data.users?.filter((i) => i.id !== data.user?.id);
	$: allChecked = availableUsers
		?.filter((i) => i.id !== data.user?.id)
		.every((i) => selectedUsers.has(i.id));

	$: checkboxState = allChecked
		? true
		: availableUsers.some((i) => selectedUsers.has(i.id))
		? null
		: false;

	function toggleCurrent() {
		if (allChecked) {
			availableUsers.forEach((i) => selectedUsers.delete(i.id));
			selectedUsers = new Set(selectedUsers);
		} else {
			availableUsers.forEach((i) => selectedUsers.add(i.id));
			selectedUsers = new Set(selectedUsers);
		}
	}

	function handleSubmit() {
		showConfirmation = true;
	}

	async function handleConfirmationClick() {
		showConfirmation = false;
		const formData = new FormData();
		selectedUsers.forEach((i) => formData.append("id", i.toString()));
		const response = await fetch("?/delete", {
			method: "POST",
			body: formData,
		});
		const result: ActionResult = deserialize(await response.text());
		await invalidateAll();
		selectedUsers = new Set();
		applyAction(result);
	}
</script>

<h2>Users</h2>

<BreadCrumbs cur="Users" />

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
					<input
						role="button"
						type="checkbox"
						title={allChecked ? "deselect all" : "select all"}
						use:tristate={checkboxState}
						on:click={toggleCurrent}
					/>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user (user.id)}
				<tr>
					<td><a href={base + uri`/users/${user.id}`}>{user.name}</a></td>
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
						{#if user.id !== data.user?.id}
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
						{:else}
							you
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6">No user is present in the response!</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<Pagination {...data.pagination} />

	<div class="form-controls">
		<a class="button" href="{base}/users/new"> Add a new user </a>
		<button class="danger" disabled={selectedUsers.size === 0}>Delete selected</button>
	</div>

	{#if selectedUsers.size > 0}
		<p>
			Selected {selectedUsers.size} elements.
			<button class="inline" on:click={() => (selectedUsers = new Set())} type="button"
				>deselect all</button
			>
		</p>
	{/if}
</form>

<Modal bind:open={showConfirmation} let:close>
	<p>You're about to irreversibly delete those entries.</p>
	<p>Are you sure?</p>
	<p>
		<button type="button" class="danger" on:click={handleConfirmationClick}> Yes </button>
		<button type="button" class="secondary" on:click={close}> No </button>
	</p>
</Modal>
