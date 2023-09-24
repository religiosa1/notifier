<script lang="ts">
	import { base } from "$app/paths";
	import type { ActionData, PageData } from "./$types";
	import { uri } from "~/helpers/uri";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import DeleteConfirmationModal from "~/components/DeleteConfirmationModal.svelte";
	import { getAuthorizationStatusName } from "@shared/models/AuthorizationEnum";
	import { getRoleName } from "@shared/models/UserRoleEnum";
	import SelectableTable from "~/components/SelectableTable.svelte";
	import GroupsPreview from "~/components/GroupsPreview.svelte";
	export let data: PageData;
	export let form: ActionData;

	let showConfirmation = false;
	let selectedUsers = new Set<number>();

	function handleSubmit() {
		showConfirmation = true;
	}
</script>

<h2>Users</h2>

<BreadCrumbs cur="Users" />

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
	<SelectableTable
		items={data.users}
		bind:selected={selectedUsers}
		selectable={(i) => i.id !== data.user?.id}
	>
		<svelte:fragment slot="header">
			<th>Name</th>
			<th>Telegram ID</th>
			<th>Authorization Status</th>
			<th>Role</th>
			<th>Groups</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={user}>
			<td><a href={base + uri`/users/${user.id}`}>{user.name}</a></td>
			<td>{user.telegramId}</td>
			<td class="text-center">{getAuthorizationStatusName(user.authorizationStatus)}</td>
			<td class="text-center">{getRoleName(user.role)}</td>
			<td class="text-center">
				<GroupsPreview groups={user.groups} />
			</td>
		</svelte:fragment>
	</SelectableTable>

	<Pagination {...data.pagination} />

	<div class="form-controls">
		<a class="button" href="{base}/users/new"> Add a new user </a>
		<button class="danger" disabled={selectedUsers.size === 0}>Delete selected</button>
	</div>
</form>
<p>
	<a href="/user-confirmation-request">list of pending authorization requests</a>
</p>

<DeleteConfirmationModal
	bind:open={showConfirmation}
	bind:selected={selectedUsers}
/>