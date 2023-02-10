<script lang="ts">
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
  {#each data.users.data as user (user.id)}
    <tr>
      <td>{user.name}</td>
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
    </tr>
  {:else}
  <tr>
    <td colspan="4">No user is present in the response!</td>
  </tr>
  {/each}
  </tbody>
</table>
<a class="button" href="./new">
  Add a new user
</a>