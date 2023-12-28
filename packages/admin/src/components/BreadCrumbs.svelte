<script lang="ts">
	import { base } from "$app/paths";

	interface Link {
		name: string;
		href: string;
	}
	export let links: Link[] | undefined = undefined;
	export let href: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let cur: string;

	$: processedLinks = Array.isArray(links)
		? links
		: href
		? [
				{ href: base + "/", name: "Home" },
				{ href: href.startsWith("/") ? base + href : href, name },
			]
		: [{ href: base + "/", name: "Home" }];
</script>

<ul class="breadcrumbs">
	{#each processedLinks as link}
		<li class="breadcrumbs__item breadcrumbs__item_link">
			<a class="breadcrumbs__link" href={link.href}>{link.name}</a>
		</li>
	{/each}
	<li class="breadcrumbs__item breadcrumbs__item_current">
		{cur}
	</li>
</ul>

<style>
	.breadcrumbs {
		font-size: 0.8rem;
		all: unset;
		display: flex;
		margin: 0.7rem 0;
	}

	.breadcrumbs__item {
		all: unset;
		display: inline-block;
		vertical-align: middle;
	}
	.breadcrumbs__item_link::after {
		content: "|";
		display: inline-block;
		margin: 0 0.3rem;
	}
</style>
