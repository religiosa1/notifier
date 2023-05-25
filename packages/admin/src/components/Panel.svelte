<script lang="ts">
  export let style: "error" | "success" | null = null;
</script>

<div
	class="panel"
	class:panel_error={style === "error"}
	class:panel_success={style === "success"}
>
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
	.panel_success {
    border-color: var(--clr-green, green);
  }
</style>