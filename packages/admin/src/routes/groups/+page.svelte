<script lang="ts">
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

<h2>Users</h2>

<BreadCrumbs cur="Users" />

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
	<SelectableTable
		items={data.groups}
		bind:selected={selectedGroups}
	>
		<svelte:fragment slot="header">
			<th>Name</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={group}>
			<td><a href={base + uri`/groups/${group.id}`}>{group.name}</a></td>
		</svelte:fragment>
	</SelectableTable>

	<Pagination {...data.pagination} />

	<div class="form-controls">
		<a class="button" href="{base}/groups/new"> Add a new user </a>
		<button class="danger" disabled={selectedGroups.size === 0}>Delete selected</button>
	</div>
</form>

<DeleteConfirmationModal
	bind:open={showConfirmation}
	bind:selected={selectedGroups}
/>
