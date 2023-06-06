<script lang="ts">
	import { hasField } from "~/helpers/hasField";
	import type { ActionValidationError } from "~/helpers/unwrapResult";
  import Panel from "./Panel.svelte";

  export let action: unknown | null;

  function isValidationError(e: unknown): e is ActionValidationError {
    return !!(hasField(e, "error") && e.error === "Validation error");
  }
</script>

{#if hasField(action, "error", "string")}
  <Panel style="error">
    {action.error}
    {#if isValidationError(action)}
      {#each action.errorDetails.allErrors as err}
        <pre>{err.path}: {err.message}</pre>
      {/each}
    {:else if hasField(action, "errorDetails", "string")}
      <pre>{action.errorDetails}</pre>
    {/if}
  </Panel>
{/if}