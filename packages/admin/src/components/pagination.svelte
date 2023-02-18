<script lang="ts">
	import { pageUrl } from "~/helpers/pagination";
	import { page } from "$app/stores";
	export let count: number;
	export let take: number;
	export let skip: number;
	export let url = $page.url.href;

	export let navWindow = 7;
	$: windowMiddle = Math.floor(navWindow / 2);

	$: currentPage = Math.floor(skip / take) + 1;
	$: totalPages = Math.ceil(count / take) + 1;

	$: currentNavItems = ((cur: number, total: number, navWindow: number) => {
		const retval: number[] = [];
		const start = Math.max(1, cur - Math.floor(navWindow / 2));
		for (let i = start; i < navWindow && i < total; i++) {
			retval.push(i);
		}
		return retval;
	})(currentPage, totalPages, navWindow);

	$: showNavigateToEnd = totalPages > navWindow;
</script>

{#if totalPages > 1}
	<nav class="pagination">
		{#if showNavigateToEnd && currentPage > windowMiddle}
			<a class="pagination__item" href={pageUrl(url, 1)}>1</a>
			<span class="pagination__eli" />
		{/if}

		{#each currentNavItems as p}
			{#if p !== currentPage}
				<a class="pagination__item" href={pageUrl(url, p)}>{p}</a>
			{:else}
				<span class="pagination__item pagination__item_current">{p}</span>
			{/if}
		{/each}

		{#if showNavigateToEnd && currentPage < totalPages - windowMiddle}
			<span class="pagination__eli" />
			<a class="pagination__item" href={pageUrl(url, totalPages - 1)}>{totalPages - 1}</a>
		{/if}
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
	}
	.pagination__eli::before {
		content: "…";
	}
	.pagination__eli,
	.pagination__item {
		box-sizing: border-box;
		display: inline-block;
		min-width: 1.5rem;
		padding: 0 0.5rem;
		height: 2rem;
		line-height: 2rem;
		text-align: center;
	}
	.pagination__item {
		color: var(--clr-txt);
		background-color: var(--clr-hbg);
		border-radius: 0.3rem;
	}
</style>
