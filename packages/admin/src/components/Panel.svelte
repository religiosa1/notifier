<script lang="ts">
  export let style: "error" | null = null;
</script>

<div class="panel" class:panel_error={style === "error"}>
  <slot />
</div>

<style>
  .panel {
    border: 1px solid var(--clr-brd, gray);
    padding: 1rem;
    border-radius: 0.3rem;
    margin: 1rem 0;
  }
  .panel_error {
    border-color: var(--clr-error, red);
  }
</style>