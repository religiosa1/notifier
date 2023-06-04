<script lang="ts">
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import type { ActionData, PageData } from "./$types";
	import { uri } from "~/helpers/uri";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import SelectableTable from "~/components/SelectableTable.svelte";
	import DeleteConfirmationModal from "~/components/DeleteConfirmationModal.svelte";
	export let data: PageData;
	export let form: ActionData;

	let showConfirmation = false;
	let selectedGroups = new Set<number>();

	function handleSubmit() {
		showConfirmation = true;
	}
</script>

<h2>Groups</h2>

<BreadCrumbs cur="Groups" />

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
	<SelectableTable
		items={data.groups}
		bind:selected={selectedGroups}
	>
		<svelte:fragment slot="header">
			<th>Name</th>
			<th class="text-center">N of channels</th>
			<th class="text-center">N of users</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={group}>
			<td><a href={base + uri`/groups/${group.id}`}>{group.name}</a></td>
			<td class="text-center">{group.channelsCount}</td>
			<td class="text-center">{group.usersCount}</td>
		</svelte:fragment>
	</SelectableTable>

	<Pagination {...data.pagination} />

	<div class="form-controls">
		<button class="danger" disabled={selectedGroups.size === 0}>Delete selected</button>
	</div>
</form>

<form method="POST" action="?/add" use:enhance>
	<p>
		<input required name="name" autocomplete="off" />
		<button>Create a new group</button>
	</p>
</form>

<DeleteConfirmationModal
	bind:open={showConfirmation}
	bind:selected={selectedGroups}
/>
