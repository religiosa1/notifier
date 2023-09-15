<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	interface $$Props extends HTMLInputAttributes {
		showPassword?: boolean;
	}
	export let showPassword = false;
</script>

<span class="password-input-wrapper">
	<input
		{...$$restProps}
		type={showPassword ? "text" : "password"}
	/>
	<button
		class="eye-btn"
		type="button"
		on:click={() => showPassword = !showPassword}
		title={showPassword ? "Hide password" : "Show password"}
	>
	</button>
</span>