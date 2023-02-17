<script lang="ts">
  import type { ActionData } from "./$types";
  import { AuthorizationEnum } from "~/models/AuthorizationEnum";
	import type { PageData } from "./$types";
  export let data: PageData;
  export let form: ActionData;

  const user = {
    ...data?.user,
    ...form,
  };
</script>

<form method="POST" action="?/edit">
  <h2>Edit user</h2>

  <p class="input-group">
    <label>
      Name
      <input
        name="name"
        type="text"
        value={user.name}
        required
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
        value={status}
        checked={status === user.authorizationStatus}
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