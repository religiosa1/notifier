<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { base } from "$app/paths";
	import type { LayoutData } from "./$types";
	import "./layout.scss";

	export let data: LayoutData;

onNavigate((navigation) => {
	if (
		!document.startViewTransition
		|| matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		return;
	}

	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
});
</script>

<div class="main-grid">
	<header class="main-grid__header">
		<a class="logo-link" href="{base}/">
			<h1 class="logo-text">Notifier</h1>
		</a>

		{#if data.user}
			<div class="user-block">
				<a href="{base}/users/{data.user.id}">{data.user.name}</a>
				<form method="post" action="/logout">
					<button class="inline">Log out</button>
				</form>
			</div>
		{/if}
	</header>
	<main class="main-grid__main">
		<slot />
	</main>
	<footer class="main-grid__footer" />
</div>

<style>
	.main-grid {
		display: grid;
		grid-template-areas:
			"header"
			"main"
			"footer";
		grid-template-rows: auto 1fr auto;
		justify-items: stretch;
		width: 100%;
		padding: 0 10px;
		max-width: 1024px;
		margin: auto;
		min-height: 100vh;
		min-height: 100dvh;
		box-sizing: border-box;
	}
	.main-grid__header {
		grid-area: header;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		grid-gap: 1rem;
		align-items: center;
	}
	.user-block {
		text-align: right;
	}
	.main-grid__main {
		grid-area: main;
	}
	.main-grid__footer {
		grid-area: footer;
		min-height: 3rem;
	}
	.logo-link {
		color: var(--clr-txt);
		text-decoration: none;
	}
	.logo-text {
		font-size: 2rem;
		margin: 0.3em 0;
	}
</style>
