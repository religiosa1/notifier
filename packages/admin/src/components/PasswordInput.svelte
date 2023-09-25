<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	export let wrapperClass = "";
	let className = "";
	export { className as class};

	interface $$Props extends HTMLInputAttributes {
		showPassword?: boolean;
		class?: string;
		wrapperClass?: string;
	}
	export let showPassword = false;
</script>

<span class="password-input-wrapper ${wrapperClass}">
	<input
		{...$$restProps}
		class={className}
		type={showPassword ? "text" : "password"}
	/>
	<button
		class="eye-btn"
		class:eye-btn_closed={!showPassword}
		type="button"
		on:click={() => showPassword = !showPassword}
		title={showPassword ? "Hide password" : "Show password"}
	>
		👁
	</button>
</span>

<style>
	.password-input-wrapper {
		display: flex;
		flex-grow: 1;
		flex-shrink: 0;
	}

	input {
		box-sizing: border-box;
		padding-right: 2.5rem;
	}
	.eye-btn {
		flex-grow: 0;
		padding-inline: 5px;
		justify-self: left;
		height: 1rem;
		width: 1rem;
		text-align: center;
		vertical-align: middle;
		line-height: 1;
		margin: auto 0;
		translate: -100%;
		position: relative;
		left: -5px;
	}
	.eye-btn_closed {
		text-decoration: line-through;
	}
</style>