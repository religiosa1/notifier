<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "~/components/pagination.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<h2>Users</h2>

<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Telegram ID</th>
      <th>Authorization Status</th>
      <th>Is admin?</th>
      <th>Groups</th>
    </tr>
  </thead>
  <tbody>
  {#each data.users as user (user.id)}
    {@const link = `${$page.url.href}/${encodeURIComponent(user.id)}/`}
    <tr>
      <td><a href={link}>{user.name}</a></td>
      <td><a href={link}>{user.telegramId}</a></td>
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
    </tr>
  {:else}
  <tr>
    <td colspan="5">No user is present in the response!</td>
  </tr>
  {/each}
  </tbody>
</table>

<Pagination {...data.pagination} />