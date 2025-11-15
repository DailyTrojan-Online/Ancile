<script lang="ts">
	import type { ImageBlock } from "$lib/layout/blocks/imageBlock";
	import type { SupabaseClient } from "@supabase/supabase-js";
	import MediaLibraryInput from "../MediaLibraryInput.svelte";
	import { getContext } from "svelte";
	import { closeTopModal } from "$lib/modalManager.svelte";
	import GenericIdClassSettings from "./GenericIdClassSettings.svelte";
	let { block }: { block: ImageBlock } = $props();
	console.log(block);
	let show = $state("content");
	let supabase: SupabaseClient = getContext("supabase");

	let image = $state(block.image);

	$inspect(image);

	let blockClasses = $state(block.classes);
	let blockId = $state(block.htmlId);

	function saveBlock() {
		block.setUrl(image);
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
					<button
						class="admin-editor-tab-button"
						class:active={show == "content"}
						onclick={() => (show = "content")}>Image Content</button
					><button
						class="admin-editor-tab-button"
						class:active={show == "advanced"}
						onclick={() => (show = "advanced")}>Advanced</button
					>
				</div>
			</div>
		</div>

		<div class="admin-editor">
			<div class="admin-editor-fullwidth">
				<div
					class="admin-editor-column admin-editor-column-noborder admin-editor-column-fullwidth"
				>
					{#if show == "content"}
						<MediaLibraryInput {supabase} bind:image></MediaLibraryInput>
					{/if}
					{#if show == "advanced"}
						<GenericIdClassSettings
							bind:id={blockId}
							bind:classes={blockClasses}
						></GenericIdClassSettings>
					{/if}
				</div>
			</div>
		</div>
		<div class="admin-page-footer">
			<button class="admin-button" onclick={saveBlock}>Save</button>
		</div>
	</div>
</div>
