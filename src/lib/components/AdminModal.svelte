<script lang="ts">
	import { fade } from "svelte/transition";
	import { mount, onDestroy, onMount, unmount } from "svelte";
	let { children, open = $bindable(false) } = $props();
	let mountedModal: any;
	let hide = $state(false);
	let wrapperEl: HTMLElement;
	$effect(() => {
		if (open) {
			console.log("modal open");
			mountedModal = mount(modal, {
				target: document.body,
			});
			hide = false;
		} else {
				if (mountedModal) {
					unmount(mountedModal);
					mountedModal = null;
				}
		}
	});

	onDestroy(() => {
		if (mountedModal) {
			unmount(mountedModal);
		}
	});
</script>

{#snippet modal()}
	<div
		bind:this={wrapperEl}
		onclick={(e) => {
			if (e.target == wrapperEl) open = false;
		}}
		onkeydown={(e) => e.key === "Escape" && (open = false)}
		role="dialog"
		tabindex="-1"
		class="admin-modal"
		class:admin-modal-out={hide}
	>
		{@render children()}
	</div>
{/snippet}
