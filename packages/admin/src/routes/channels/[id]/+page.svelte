<script lang="ts">
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { ActionData, PageData } from "./$types";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import SelectableTable from "~/components/SelectableTable.svelte";
	import { uri } from "~/helpers/uri";

	export let data: PageData;
	export let form: ActionData;

	let selectedGroups = new Set<number>();
</script>

<h2>Edit channel</h2>

<BreadCrumbs cur="edit" href="{base}/channels" name="Channels" />
<ErrorPanel action={form} />

<form method="post" action="?/edit" use:enhance>
	<p class="input-group">
		<label>
			<span class="form-label">Name</span>
			<input required name="name" type="text" value={data.channel?.name} autocomplete="off" />
		</label>
	</p>
	<div class="form-controls">
		<button>Save</button>
	</div>
</form>

<form method="post" action="?/disconnectGroups" use:enhance={() => async ({ update }) => {
	await update();
	selectedGroups = new Set();
}
}>
	<h3>The channel is accessible to the following groups</h3>
	<SelectableTable items={data.channel?.groups} bind:selected={selectedGroups}>
		<svelte:fragment slot="header">
			<th>Name</th>
		</svelte:fragment>

		<svelte:fragment slot="body" let:item={group}>
			<td><a href={base + uri`/groups/${group.id}`}>{group.name}</a></td>
		</svelte:fragment>

		<svelte:fragment slot="empty">
			No groups connected to the channel. <br />
			It isn't accessible to any user.
		</svelte:fragment>
	</SelectableTable>

	{#if data?.channel?.groups.length}
		<div class="form-controls">
			<button class="danger" disabled={selectedGroups.size === 0}>Disconnect selected</button>
			<button class="danger" formaction="?/disconnectAllGroups">Disconnect all</button>
		</div>
	{/if}
</form>

<form method="POST" action="?/addOrCreateGroup" use:enhance>
	<p>
		<input required name="name" autocomplete="off" list="available-groups"/>
		<datalist id="available-groups">
			{#each data.groups as group}
				<option value={group.name} />
			{/each}
		</datalist>
		<button>Add group</button>
	</p>
</form>
