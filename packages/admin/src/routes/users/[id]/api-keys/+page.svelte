<script lang="ts">
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";
	import type { PageData } from "./$types";
	import BreadCrumbs from "~/components/BreadCrumbs.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
	import Pagination from "~/components/pagination.svelte";

	export let data: PageData;
	export let form: ActionData;
</script>

<h2>API Keys - {data?.user?.name}</h2>

<BreadCrumbs cur="API keys" links={[
	{ href: base + "/", name: "Home" },
	{ href: base + "/users", name: "Users" },
	{ href: base + `/users/${data.user.id}`, name: data?.user.name || ""},
]}/>

<ErrorPanel action={form} />

<div class="card card_form">
	<h3>Channels</h3>
		<table class="table">
			<thead>
				<tr>
					<th>Prefix</th>
					<th>Created At</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data?.keys as key}
					<tr>
						<td>{key.prefix}</td>
						<td>{key.createdAt}</td>
						<td>
							<form method="post" action="?/delete" use:enhance>
								<input type="hidden" name="prefix" value={key.prefix} />
								<button class="danger">delete</button>
							</form>
						</td>
					</tr>
				{:else}
					<tr><td colspan="3">This user doesn't have any API Key created</td></tr>
				{/each}
			</tbody>
		</table>
		<Pagination {...data.pagination} />
	<div class="form-controls">
		{#if (data?.keys?.length ?? 0)> 1}
			<form method="post" action="?/deleteAll" use:enhance>
				<button class="danger">
					Delete ALL API keys for the user
				</button>
			</form>
		{/if}
		<h4>Create a new API key</h4>
		<form method="post" action="?/add" use:enhance>
			<p>That's not a part of the normal workflow.</p>
			<p>User can request his own API keys through the telegram bot commands</p>
			<p>If you create an API-key for a user yourself you MUST send him the generated key</p>
			<p>
				<button>Create a new API key</button>
			</p>
			{#if form?.apiKey}
			<p>
				Bellow is the generated API key.
			</p>
			<p>
				Copy it and send to the user, as it will never be shown again.
			</p>
			<p>
				<output>{form?.apiKey}</output>
			</p>
			{/if}
		</form>
	</div>
</div>