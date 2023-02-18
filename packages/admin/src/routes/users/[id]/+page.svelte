<script lang="ts">
  import type { ActionData } from "./$types";
  import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
	import type { PageData } from "./$types";
	import { UserRoleEnum } from "@shared/models/UserRoleEnum";
  export let data: PageData;
  export let form: ActionData;

  const user = {
    ...data?.user,
    ...form,
  };
</script>

<h2>Edit user</h2>

<form method="POST" action="?/edit">
  <p class="input-group">
    <label>
      Name
      <input
        name="name"
        type="text"
        value={user.name}
        autocomplete="username"
      />
    </label>
  </p>
  <p class="input-group">
    <label>
      Telegram Id
      <input
        name="telegramId"
        type="text"
        value={user.telegramId}
        required
      />
    </label>
  </p>
  <fieldset class="input-group">
    <legend>Authorizarion status</legend>
    {#each Object.entries(AuthorizationEnum) as [statusName, status]}
    <label>
      {statusName}
      <input
        name="authorizationStatus"
        type="radio"
        required
        value={status}
        checked={status == user.authorizationStatus}
      />
    </label>
    {/each}
  </fieldset>
  <fieldset class="input-group">
    <legend>User role</legend>
    {#each Object.entries(UserRoleEnum) as [roleName, status]}
    <label>
      {roleName}
      <input
        name="role"
        type="radio"
        required
        value={status}
        checked={status == user.role}
      />
    </label>
    {/each}
  </fieldset>

  <button class="button">Save</button>
</form>

<form method="POST" action="?/resetPassword">
  <h3>Reset password</h3>

  <p class="input-group">
    <label>
      Password
      <input
        name="name"
        type="password"
        required
      />
    </label>
  </p>

  <button class="button">Reset</button>
</form>