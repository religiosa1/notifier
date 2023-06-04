<script lang="ts">
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
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

<h2>Channels</h2>

<BreadCrumbs cur="Channels" />

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
	<SelectableTable
		items={data.channels}
		bind:selected={selectedGroups}
	>
		<svelte:fragment slot="header">
			<th>Name</th>
			<th class="text-center">N of groups</th>
			<th class="text-center">N of users</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={channel}>
			<td><a href={base + uri`/channels/${channel.id}`}>{channel.name}</a></td>
			<td class="text-center">{channel.groupsCount}</td>
			<td class="text-center">{channel.usersCount}</td>
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
		<button>Create a new channel</button>
	</p>
</form>


<DeleteConfirmationModal
	bind:open={showConfirmation}
	bind:selected={selectedGroups}
/>
