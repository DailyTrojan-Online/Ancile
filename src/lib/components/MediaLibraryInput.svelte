<script lang="ts">
	import MediaLibrary from "$lib/components/MediaLibrary.svelte";
	import { fade } from "svelte/transition";
	import AdminModal from "$lib/components/AdminModal.svelte";
	import { closeModalById, openModal } from "$lib/modalManager.svelte";

	let { image = $bindable(""), supabase, title = "Image" } = $props();
	let mediaLibraryModalId: string;

	let selectedItem: any = $state(null);
	function onMediaConfirm() {
		closeMediaLibraryModal();
		if (selectedItem) {
			image = selectedItem.url;
		}
	}

	function openMediaLibraryModal() {
		mediaLibraryModalId = openModal(mediaLibraryModal, "snippet", "center")
	}
	function closeMediaLibraryModal() {
		closeModalById(mediaLibraryModalId);
	}
</script>

<div class="admin-editor-input-group">
	<div class="admin-editor-input-label">{title}</div>
	<button
		onclick={openMediaLibraryModal}
		class="admin-editor-metadata-featured-image"
	>
		{#if image && image != ""}
			<img
				src={image}
				alt=""
				class="admin-editor-metadata-featured-image-preview"
			/>
		{/if}
		<div
			class="admin-editor-metadata-featured-image-button"
			class:admin-editor-metadata-featured-image-button-exist={image != "" &&
				image != null}
		>
			Select Image
		</div>
	</button>
</div>

{#snippet mediaLibraryConfirmButton()}
	<button class="admin-button" onclick={onMediaConfirm}>Select</button>
{/snippet}

{#snippet mediaLibraryModal()}
<div class="admin-modal-content">
		<MediaLibrary
			{supabase}
			bind:selectedItem
			actionBarContent={mediaLibraryConfirmButton}
			showCloseButton={true}
		></MediaLibrary>
	</div>
{/snippet}