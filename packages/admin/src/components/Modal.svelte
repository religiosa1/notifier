<script lang="ts">
	import { createEventDispatcher } from "svelte";
	export let lightBackDrop = false;
	export let open = true;

	const dispatcher = createEventDispatcher();
	let dialogRef: HTMLDialogElement;

	function modal(el: HTMLDialogElement, open: boolean) {
		function handler(open: boolean) {
			if (open && !el.open) {
				el.showModal();
			} else if (!open && el.open) {
				el.close();
			}
		}
		handler(open);
		return {
			update(open: boolean) {
				handler(open);
			},
			destroy() {
				handler(false);
			},
		};
	}

	function handleClose(e: Event) {
		open = false;
		dispatcher("close", e);
	}

	function close() {
		dialogRef.close();
	}

	function handleBackdropClick(e: MouseEvent) {
		const rect = dialogRef.getBoundingClientRect();
		const isClickOutside = !(
			rect.top <= e.clientY &&
			e.clientY <= rect.top + rect.height &&
			rect.left <= e.clientX &&
			e.clientX <= rect.left + rect.width
		);
		if (isClickOutside) {
			close();
		}
	}
</script>

<!-- on escape os handled natively, no need for a separate onKeyDown -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
	class="dialog"
	class:dialog_backdrop-light={lightBackDrop}
	bind:this={dialogRef}
	use:modal={open}
	on:close={handleClose}
	on:click|self={handleBackdropClick}
>
	<button type="button" title="close" class="btn-close secondary" on:click={close}> 🗙 </button>
	<slot {close} />
</dialog>

<style>
	.dialog {
		background-color: var(--clr-bg, #fff);
		border: 1px solid var(--clr-brd, #aaa);
		box-shadow: 0 0 10px var(--clr-shadow, rgba(0, 0, 0, 0.1));
		border-radius: 0.3rem;
		color: var(--clr-txt);
	}
	.dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(2px);
	}

	@media (prefers-color-scheme: dark) {
		.dialog::backdrop {
			background-color: rgba(255, 255, 255, 0.1);
		}
	}

	.dialog_backdrop-light::backdrop {
		background-color: rgba(0, 0, 0, 0.075);
		backdrop-filter: none;
	}
	@media (prefers-color-scheme: dark) {
		.dialog_backdrop-light::backdrop {
			background-color: rgba(255, 255, 255, 0.075);
		}
	}

	.btn-close {
		position: absolute;
		top: 0.5em;
		right: 0.5em;
		padding: 0.2em;
		line-height: 1;
	}
</style>
