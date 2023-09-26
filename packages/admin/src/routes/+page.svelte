<script lang="ts">
	import type { PageData } from "./$types";
	export let data: PageData;
</script>

<h2>Welcome, {data.user?.name}</h2>
<h3>Main functionality</h3>
<nav class="tile-nav">
	<a class="tile-nav__item button outline" href="./send-notification"> send notification </a>
	<a class="tile-nav__item button outline" href="./user-confirmation-request">
		pending authorization requests
	</a>
</nav>

<h3>Permission settings</h3>
<nav class="tile-nav">
	<a class="tile-nav__item button outline" href="./users"> users </a>
	<a class="tile-nav__item button outline" href="./groups"> groups </a>
	<a class="tile-nav__item button outline" href="./channels"> channels </a>
</nav>
<p>
	<a href="./settings">App settings</a>
</p>
<style>
	.tile-nav {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.tile-nav__item {
		padding: 1rem;
	}
</style>
