<script lang="ts">
	import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
	import { UserRoleEnum } from "@shared/models/UserRoleEnum";

  export let form: ActionData;

  const user = {
    ...form,
  };
</script>

<h2>Create a new user</h2>

<p>Attention! That's not a part of a normal user flow!</p>
<p>
  Your user should use /start command in telegram bot. Here you have to
  enter telegramId manually. It's not the same as telegram user handle, it's
  an id. I hope you know what you're doing.
</p>
{#if form?.error}
  <p class="error">
    {form?.error}
  </p>
  <pre>{JSON.stringify(form?.errorDetails, undefined, 2)}</pre>

{/if}
<form method="POST"  action="?/create">
  <p class="input-group">
    <label>
      Name
      <input
        name="name"
        type="text"
        value={user.name || ""}
        required
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
        value={user.telegramId || ""}
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
        checked={status === user.authorizationStatus}
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
        checked={status === user.userRole}
      />
    </label>
    {/each}
  </fieldset>
  <p class="input-group">
    <label>
      Password
      <input
        name="password"
        type="password"
        required
        autocomplete="new-password"
      />
    </label>
  </p>

  <button class="button">Save</button>
</form>
