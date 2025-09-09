<script lang="ts">
	import { fade } from "svelte/transition";
	import { mount, onDestroy, onMount, unmount } from "svelte";
	let { children, open = $bindable(false) } = $props();
	let mountedModal: any;
	let wrapperEl: HTMLElement;
	$effect(() => {
		if (open) {
			console.log("modal open");
			mountedModal = mount(modal, {
				target: document.body,
			});
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
		tabindex="-1"
		class="admin-modal"
	>
		{@render children()}
	</div>
{/snippet}
