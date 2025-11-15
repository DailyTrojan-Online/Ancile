<script lang="ts">
	import { closeTopModal } from "$lib/modalManager.svelte";
	import GenericIdClassSettings from "./GenericIdClassSettings.svelte";
	import type {
		PostBlock,
		PostBlockImagePosition,
	} from "$lib/layout/blocks/postBlock";
	import CheckboxInput from "../CheckboxInput.svelte";
	let { block }: { block: PostBlock } = $props(); // TODO: set the type of this to the particular block being modified

	let show = $state("layout");
	let blockClasses = $state(block.classes);
	let blockId = $state(block.htmlId);

	let imagePosition: PostBlockImagePosition = $state(block.imagePosition);

	let showHeadline = $state(block.showHeadline);
	let showSubheadline = $state(block.showSubheadline);
	let showByline = $state(block.showByline);
	let showPublish = $state(block.showPublishDate);

	function saveBlock() {
		// add other data to save to the block
		block.imagePosition = imagePosition;
		block.showHeadline = showHeadline;
		block.showSubheadline = showSubheadline;
		block.showByline = showByline;
		block.showPublishDate = showPublish;
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
						class:active={show == "layout"}
						onclick={() => (show = "layout")}>Layout</button
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
			<div
				class="admin-editor-column admin-editor-column-noborder"
				style:width="340px"
			>
				<!-- Add screens here based on the tab selectors -->
				{#if show == "advanced"}
					<GenericIdClassSettings bind:id={blockId} bind:classes={blockClasses}
					></GenericIdClassSettings>
				{/if}

				{#if show == "layout"}
					<h2>Content</h2>
					<div class="admin-editor-checkbox-list">
						<div
							class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
						>
							<span>
								<h4 class="admin-editor-input-title">Show Headline</h4>
							</span>
							<CheckboxInput bind:value={showHeadline} />
						</div>
						<div
							class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
						>
							<span>
								<h4 class="admin-editor-input-title">Show Subheadline</h4>
							</span>
							<CheckboxInput bind:value={showSubheadline} />
						</div>
						<div
							class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
						>
							<span>
								<h4 class="admin-editor-input-title">Show Byline</h4>
							</span>
							<CheckboxInput bind:value={showByline} />
						</div>
						<div
							class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
						>
							<span>
								<h4 class="admin-editor-input-title">Show Publish Date</h4>
							</span>
							<CheckboxInput bind:value={showPublish} />
						</div>
					</div>
					<h2>Image</h2>
					<div class="admin-editor-input-group">
						<div class="admin-editor-input-label">Image Position</div>
						<div class="admin-editor-image-position-grid">
							<button
								class="admin-editor-image-position-top"
								class:active={imagePosition == "top"}
								onclick={() => {
									imagePosition = "top";
								}}>Top</button
							>
							<button
								class="admin-editor-image-position-left"
								class:active={imagePosition == "left"}
								onclick={() => {
									imagePosition = "left";
								}}>Left</button
							>
							<button
								class="admin-editor-image-position-center"
								class:active={imagePosition == "none"}
								onclick={() => {
									imagePosition = "none";
								}}>None</button
							>
							<button
								class="admin-editor-image-position-right"
								class:active={imagePosition == "right"}
								onclick={() => {
									imagePosition = "right";
								}}>Right</button
							>
							<button
								class="admin-editor-image-position-bottom"
								class:active={imagePosition == "bottom"}
								onclick={() => {
									imagePosition = "bottom";
								}}>Bottom</button
							>
						</div>
					</div>
				{/if}
			</div>
			<div class="admin-editor-column admin-editor-column-fullwidth">
				<!-- Add screens here based on the tab selectors -->
				<h2>Preview</h2>
				<div class={"ancile-post"} class:ancile-post-image-left={imagePosition == "left"} class:ancile-post-image-bottom={imagePosition == "bottom"} class:ancile-post-image-right={imagePosition == "right"}>
					{#if imagePosition != "none"}
						<div class="ancile-post-image">
							<img src="https://placedog.net/300x200?r" alt="" />
						</div>
					{/if}
					<div class="ancile-post-text">
						{#if showHeadline}
							<h1>Title</h1>
						{/if}
						{#if showSubheadline}
							<p>Subheadline</p>
						{/if}
						{#if showByline}
							<p>Byline</p>
						{/if}
						{#if showPublish}
							<p>Publish date</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div class="admin-page-footer">
			<button class="admin-button" onclick={saveBlock}>Save</button>
		</div>
	</div>
</div>

<style>
	.admin-editor-image-position-grid {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		border-radius: 5px;
		border: 1px solid var(--border);
		padding: 4px;
		gap: 4px;
		box-sizing: border-box;
	}
	.admin-editor-image-position-grid button {
		background: transparent;
		border: none;
		border-radius: 5px;
		padding: 8px 0;
		cursor: pointer;
	}
	.admin-editor-image-position-grid button:hover {
		background: var(--accent-bg);
		color: var(--accent);
	}
	.admin-editor-image-position-grid button.active {
		background: var(--accent);
		color: white;
	}
	.admin-editor-image-position-top {
		grid-row: 1 / 1;
		grid-column: 2 / 2;
	}
	.admin-editor-image-position-left {
		grid-row: 2 / 2;
		grid-column: 1 / 1;
	}
	.admin-editor-image-position-center {
		grid-row: 2 / 2;
		grid-column: 2 / 2;
	}
	.admin-editor-image-position-right {
		grid-row: 2 / 2;
		grid-column: 3 / 3;
	}
	.admin-editor-image-position-bottom {
		grid-row: 3 / 3;
		grid-column: 2 / 2;
	}


	.ancile-post {
		display: flex;
		flex-direction: column;
	}

	.ancile-post-image-bottom {
		flex-direction: column-reverse;
	}
	.ancile-post-image-left {
		flex-direction: row;
	}
	.ancile-post-image-right {
		flex-direction: row-reverse;
	}
	.ancile-post-text {
		width: 100%;
	}

	.ancile-post-image {
		width: 100%;
	}

	.ancile-post-image img {
		width: 100%;
	}
</style>
