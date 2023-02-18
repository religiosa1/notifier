<script lang="ts">
	import { pageUrl } from "~/helpers/pagination";
	import { page } from "$app/stores";
	export let count: number;
	export let take: number;
	export let skip: number;
	export let url = $page.url.href;

	$: currentPage = Math.floor(skip / take) + 1;
	$: totalPages = Math.ceil(count / take);
</script>

{#if totalPages > 1}
	<nav class="pagination">
		{#if currentPage > 1}
			<a class="pagination__item button secondary" href={pageUrl(url, 1)} title="first page">«</a>
			<a class="pagination__item button secondary" href={pageUrl(url, currentPage - 1)} title="previous page">‹</a>
		{:else}
			<span class="pagination__item button secondary disabled">«</span>
			<span class="pagination__item button secondary disabled">‹</span>
		{/if}

		<span class="pagination__info">
			Page {currentPage} / {totalPages}, items {skip + 1}&ndash;{Math.min(skip + take, count)} / {count}
		</span>

		{#if currentPage < totalPages}
			<a class="pagination__item button secondary" href={pageUrl(url, currentPage + 1)} title="next page">›</a>
			<a class="pagination__item button secondary" href={pageUrl(url, totalPages - 1)} title="last page">»</a>
		{:else}
			<span class="pagination__item button secondary disabled">›</span>
			<span class="pagination__item button secondary disabled">»</span>
		{/if}
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
		align-items: center;
	}
	.pagination__info,
	.pagination__item {
		box-sizing: border-box;
		display: inline-block;
		min-width: 1.5rem;
		padding: 0 0.5rem;
		height: 2rem;
		line-height: 2rem;
		text-align: center;
		text-decoration: none;
	}
</style>
