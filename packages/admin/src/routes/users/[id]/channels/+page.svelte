<script lang="ts">
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";
	import type { PageData } from "./$types";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import Pagination from "~/components/pagination.svelte";
	import DeleteConfirmationModal from "~/components/DeleteConfirmationModal.svelte";
	import SelectableTable from "~/components/SelectableTable.svelte";
	import { uri } from "~/helpers/uri";

	export let data: PageData;
	export let form: ActionData;

	let showConfirmation = false;
	let selectedChannels = new Set<number>();

	function handleSubmit() {
		showConfirmation = true;
	}
</script>

<h2>Notification channels - {data?.user?.name}</h2>

<BreadCrumbs cur="channels" links={[
	{ href: base + "/", name: "Home" },
	{ href: base + "/users", name: "Users" },
	{ href: base + `/users/${data.user.id}`, name: data?.user.name || ""},
]}/>

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<div class="card card_form">
	<h3>Channels</h3>

	<form method="post" action="?/delete" on:submit|preventDefault={handleSubmit}>
		<SelectableTable
			items={data.channels}
			bind:selected={selectedChannels}
		>
			<svelte:fragment slot="header">
				<th>Name</th>
			</svelte:fragment>

			<svelte:fragment slot="body" let:item={channel}>
				<td><a href={base + uri`/channels/${channel.id}`}>{channel.name}</a></td>
			</svelte:fragment>
		</SelectableTable>

		<Pagination {...data.pagination} />
	</form>
	<div class="form-controls">
		<form method="post" action="?/add" use:enhance style="display:inline-block">
			<!-- TODO fancy select TODO availableChannels -->
			<select name="channel">
				{#each data.channels as channel (channel.id)}
					<options value={channel.id}>{channel.name}</options>
				{:else}
					<option disabled>There's no channels available to the user. Is he a member of any group?</option>
				{/each}
			</select>
			<button>Add a channel</button>
		</form>
		<button
			class="danger"
			formAction="?/delete"
			disabled={selectedChannels.size === 0}
		>
			Delete selected
		</button>
	</div>
</div>

<DeleteConfirmationModal
	bind:open={showConfirmation}
	bind:selected={selectedChannels}
/>