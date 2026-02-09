<script lang="ts">
	import { closeTopModal } from "$lib/modalManager.svelte";
	import GenericIdClassSettings from "./GenericIdClassSettings.svelte";
	import { Block } from "$lib/layout/lithograph";
	let { block }: { block: Block } = $props(); // TODO: set the type of this to the particular block being modified
	
	let show = $state("content");
	let blockClasses = $state(block.classes);
	let blockId = $state(block.htmlId);

	function saveBlock() {
		// add other data to save to the block
		block.setCSSClasses(blockClasses);
		block.setHtmlId(blockId);
		closeTopModal();
	}
</script>

<div class="admin-modal-content">
	<div class="admin-page-content">
		<div class="admin-page-header">
			<button
				class="admin-header-tame-button admin-modal-close-button"
				aria-label="Close modal"
				onclick={closeTopModal}
			>
				<i class="ti ti-x"></i>
			</button>
			<div class="admin-buttons">
				<div class="admin-editor-tab-selector">
					<!-- Add tabs here -->
					 <button
						class="admin-editor-tab-button"
						class:active={show == "content"}
						onclick={() => (show = "content")}>Content</button
					>
					<button
						class="admin-editor-tab-button"
						class:active={show == "advanced"}
						onclick={() => (show = "advanced")}>Advanced</button
					>
				</div>
			</div>
		</div>

		<div class="admin-editor">
			<div class="admin-editor-fullwidth">
				<!-- Add screens here based on the tab selectors -->
				{#if show == "advanced"}
				<GenericIdClassSettings bind:id={blockId} bind:classes={blockClasses}></GenericIdClassSettings>
				{/if}
			</div>
		</div>
		<div class="admin-page-footer">
			<button class="admin-button" onclick={saveBlock}>Save</button>
		</div>
	</div>
</div>
