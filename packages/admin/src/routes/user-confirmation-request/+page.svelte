<script lang="ts">
	import { base } from "$app/paths";
	import type { ActionData, PageData } from "./$types";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import SelectableTable from "~/components/SelectableTable.svelte";
	import { getRoleName } from "@shared/models/UserRoleEnum";
	import GroupsPreview from "~/components/GroupsPreview.svelte";
	import { uri } from "~/helpers/uri";
	import { enhance } from "$app/forms";

	export let data: PageData;
	export let form: ActionData;

	let selectedUsers = new Set<number>();
</script>

<h2>Pending authorization requests</h2>

<BreadCrumbs cur="Pending authorization requests" />

<p>
	When a user tries to join the bot, he must pass the admin validation.
	Here you can accept or decline users' authorization requests.
</p>

<BatchStatsPanel
	action={form?.data}
	verb={form?.verb || "?"}
	entityName="users"
/>
<ErrorPanel action={form?.data} />

<form method="post" action="?/accept"  use:enhance={() => async ({ update }) => {
		await update();
		selectedUsers = new Set();
	}
}>
	<SelectableTable
		items={data.users}
		bind:selected={selectedUsers}
		selectable={(i) => i.id !== data.user?.id}
	>
		<svelte:fragment slot="header">
			<th>Name</th>
			<th>Telegram ID</th>
			<th>Role</th>
			<th>Groups</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={user}>
			<td><a href={base + uri`/users/${user.id}`}>{user.name}</a></td>
			<td>{user.telegramId}</td>
			<td class="text-center">{getRoleName(user.role)}</td>
			<td class="text-center">
				<GroupsPreview groups={user.groups} />
			</td>
		</svelte:fragment>

		<svelte:fragment slot="empty">
			No pending authorization requests.
		</svelte:fragment>
	</SelectableTable>

	<Pagination {...data.pagination} />

	<div class="form-controls">
		<button disabled={selectedUsers.size === 0}>Accept selected</button>
		<button formaction="?/decline" class="danger" disabled={selectedUsers.size === 0}>
			Decline selected
		</button>
	</div>
</form>
<p>
	<a href="/users">list of all users</a>
</p>