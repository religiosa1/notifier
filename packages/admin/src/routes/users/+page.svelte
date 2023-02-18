<script lang="ts">
	import { base } from "$app/paths";
  import { page } from "$app/stores";
	import BatchStatsPanel from "~/components/BatchStatsPanel.svelte";
	import ErrorPanel from "~/components/ErrorPanel.svelte";
  import Pagination from "~/components/pagination.svelte";
  import type { ActionData, PageData } from "./$types";
  export let data: PageData;
  export let form: ActionData;

  function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    if (confirm("You're about to irreversibly delete the following user. Are you sure?")) {
      e.currentTarget.submit();
    }
  }
</script>

<h2>Users</h2>

<BatchStatsPanel action={form} />
<ErrorPanel action={form} />

<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Telegram ID</th>
      <th>Authorization Status</th>
      <th>Is admin?</th>
      <th>Groups</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
  {#each data.users as user (user.id)}
    {@const link = `${$page.url.href}/${encodeURIComponent(user.id)}/`}
    <tr>
      <td><a href={link}>{user.name}</a></td>
      <td>{user.telegramId}</td>
      <td>{user.authorizationStatus}</td>
      <td>{!!user.password}</td>
      <td>
        {#each user.groups.slice(0, 10) as group (group.id) }
          {group.name}
        {/each}
        {#if user.groups.length > 10}
        { user.groups.length - 10 } more.
        {/if}
      </td>
      <td>
        <form
          method="post"
          action="?/delete"
          on:submit|preventDefault={handleSubmit}
        >
          <input
            type="hidden"
            value={user.id}
            name="id"
          />
          <button class="secondary">Delete</button>
        </form>
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

<p>
  <a class="button" href="{base}/users/new">
    Add a new user
  </a>
</p>