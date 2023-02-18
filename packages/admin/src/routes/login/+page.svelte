<script lang="ts">
  import type { ActionData } from "./$types";
  export let form: ActionData;
</script>
<form method="POST">
  <h2>Log in</h2>
  <p class="input-group">
    <label>
      Name
      <input
        name="name"
        type="text"
        value={form?.name ?? ''}
        required
      />
    </label>
  </p>
  <p class="input-group">
    <label>
      Password
      <input
        name="password"
        type="password"
        required
      />
    </label>
  </p>
  {#if form?.error}
    <p class="error">
      {form?.errorDetails}
    </p>
  {/if}
  <p class="input-group">
    <button>Log in</button>
  </p>
</form>

<style>
.error {
  color: var(--clr-error);
}
.input-group input {
  display: block;
  margin: 0.3rem 0 0;
}
</style>