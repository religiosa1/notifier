<script lang="ts">
	import { applyAction, enhance } from "$app/forms";
	import { invalidate } from "$app/navigation";
  import type { ActionData } from "./$types";
	import PasswordInput from "~/components/PasswordInput.svelte";
	import FormResultPanel from "~/components/FormResultPanel.svelte";
  export let form: ActionData;
</script>
<form method="POST" use:enhance={() => async ({result}) => {
  await applyAction(result);
  await invalidate("app:user");
}}>
  <h2>Log in</h2>
  <p class="input-group">
    <label>
      Name
      <input
        name="name"
        type="text"
        value={form?.name ?? ''}
        autocomplete="username"
        required
      />
    </label>
  </p>
  <p class="input-group">
    <label for={undefined}>
      Password
      <PasswordInput
        wrapperClass="input"
        name="password"
        type="password"
        autocomplete="current-password"
        required
      />
    </label>
  </p>
  <FormResultPanel {form} />
  <p class="input-group">
    <button>Log in</button>
  </p>
</form>

<style>
.input-group input,
.input-group :global(.input) {
  display: block;
  margin: 0.3rem 0 0;
}
</style>