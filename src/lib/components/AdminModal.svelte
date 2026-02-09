<script lang="ts">
	import { fade, fly, scale } from "svelte/transition";
	import { mount, onDestroy, onMount, unmount } from "svelte";
	import type { Snippet } from "svelte";

	import { closeTopModal, modals } from "$lib/modalManager.svelte";

	let mountedModal: any;
	let hide = $state(false);
	let wrapperEl: HTMLElement;
	let open: boolean = $derived(modals.length > 0);
</script>

{#if open}
	<div
		bind:this={wrapperEl}
		onclick={(e) => {
			if (e.target == wrapperEl) closeTopModal();
		}}
		onkeydown={(e) => e.key === "Escape" && closeTopModal()}
		role="dialog"
		tabindex="-1"
		class="admin-modal"
		transition:fade={{ duration: 100 }}
		class:admin-modal-out={hide}
	>
		{#each modals as modal, i}
			<div
				transition:fly={{ duration: 300, y: -50 }}
				class="admin-modal-offset"
				style:filter={`brightness(${1 - (modals.length - i - 1) * 0.1})`}
				style:transform={`translateY(${(modals.length - i - 1) * 50}px) scale(${1 - (modals.length - i - 1) * 0.1}) `}
			>
				{#if modal.kind == "snippet"}
					{@render modal.snippet()}
				{:else if modal.kind == "component"}
					<modal.component {...modal.props}></modal.component>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.admin-modal-offset {
		position: fixed;
		width: 100vw;
		top: 0;
		left: 0;
		height: 100vh;
		transition:
			transform 0.3s,
			filter 0.3s;
		pointer-events: none;
	}
</style>
