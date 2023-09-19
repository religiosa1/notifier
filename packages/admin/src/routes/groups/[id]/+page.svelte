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

	let selectedUsers = new Set<number>();
	let selectedChannels = new Set<number>();
</script>

<h2>Edit group</h2>

<BreadCrumbs cur="edit" href="{base}/groups" name="Groups" />
<ErrorPanel action={form} />

<form method="post" action="?/edit" use:enhance>
	<p class="input-group">
		<label>
			<span class="form-label">Name</span>
			<input required name="name" type="text" value={data.group?.name} autocomplete="off" />
		</label>
	</p>
	<div class="form-controls">
		<button>Save</button>
	</div>
</form>


<details class="card card-details">
	<summary class="card-details__summary">
		Users belonging to this group
	</summary>
	<form method="post" action="?/disconnectUsers" use:enhance={() => async ({ update }) => {
		await update();
		selectedUsers = new Set();
	}
	}>
		<SelectableTable items={data.group?.users} bind:selected={selectedUsers}>
			<svelte:fragment slot="header">
				<th>Name</th>
			</svelte:fragment>

			<svelte:fragment slot="body" let:item={user}>
				<td><a href={base + uri`/users/${user.id}`}>{user.name}</a></td>
			</svelte:fragment>

			<svelte:fragment slot="empty">
				No user is a member of this group.
			</svelte:fragment>
		</SelectableTable>

		{#if data?.group?.users.length}
			<div class="form-controls">
				<button class="danger" disabled={selectedUsers.size === 0}>Remove selected users</button>
				<button class="danger" formaction="?/disconnectAllUsers">Remove all users</button>
			</div>
		{/if}
	</form>
	<form method="POST" action="?/addUser" use:enhance>
		<p>
			<input required name="name" autocomplete="off" list="available-users"/>
			<datalist id="available-users">
				{#each data.users as user}
					<option value={user.name} />
				{/each}
			</datalist>
			<button>Add user</button>
		</p>
	</form>
</details>

<details class="card card-details">
	<summary class="card-details__summary">
		Channels accessible to members of this group
	</summary>

	<form method="post" action="?/disconnectChannels" use:enhance={() => async ({ update }) => {
		await update();
		selectedChannels = new Set();
	}
	}>
		<SelectableTable items={data.group?.channels} bind:selected={selectedChannels}>
			<svelte:fragment slot="header">
				<th>Name</th>
			</svelte:fragment>

			<svelte:fragment slot="body" let:item={channel}>
				<td><a href={base + uri`/channels/${channel.id}`}>{channel.name}</a></td>
			</svelte:fragment>

			<svelte:fragment slot="empty">
				No channel is connected to this group.
			</svelte:fragment>
		</SelectableTable>

		{#if data?.group?.channels.length}
			<div class="form-controls">
				<button class="danger" disabled={selectedChannels.size === 0}>Remove selected channels</button>
				<button class="danger" formaction="?/disconnectAllChannels">Remove all channels</button>
			</div>
		{/if}
	</form>
	<form method="POST" action="?/addChannel" use:enhance>
		<p>
			<input required name="name" autocomplete="off" list="available-channels"/>
			<datalist id="available-channels">
				{#each data.channels as channel}
					<option value={channel.name} />
				{/each}
			</datalist>
			<button>Add a channel</button>
		</p>
	</form>
</details>