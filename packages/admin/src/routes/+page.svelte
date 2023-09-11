<script lang="ts">
	import type { PageData } from "./$types";
	export let data: PageData;
</script>

<h2>Welcome, {data.user?.name}</h2>
<h3>Main functionality</h3>
<nav class="tile-nav">
	<a class="tile-nav__item button secondary" href="./send-notification"> send notification </a>
	<a class="tile-nav__item button secondary" href="./auth-request">
		pending authorization requests
	</a>
</nav>

<h3>Permission settings</h3>
<nav class="tile-nav">
	<a class="tile-nav__item button secondary" href="./users"> users </a>
	<a class="tile-nav__item button secondary" href="./groups"> groups </a>
	<a class="tile-nav__item button secondary" href="./channels"> channels </a>
</nav>

<a href="./settings">App settings</a>

<style>
	.tile-nav {
		display: flex;
		gap: 1rem;
	}
	.tile-nav__item {
		padding: 1rem;
	}
</style>
