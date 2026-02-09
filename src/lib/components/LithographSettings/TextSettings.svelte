<script lang="ts">
	import Blockquote from "@tiptap/extension-blockquote";
	import { BulletList } from "@tiptap/extension-bullet-list";
	import Document from "@tiptap/extension-document";
	import { HardBreak } from "@tiptap/extension-hard-break";
	import { Heading } from "@tiptap/extension-heading";
	import { ListItem } from "@tiptap/extension-list-item";
	import { OrderedList } from "@tiptap/extension-ordered-list";
	import { Paragraph } from "@tiptap/extension-paragraph";
	import { Text } from "@tiptap/extension-text";
	import Typography from "@tiptap/extension-typography";
	import History from "@tiptap/extension-history";

	import Placeholder from "@tiptap/extension-placeholder";

	import Bold from "@tiptap/extension-bold";
	import Italic from "@tiptap/extension-italic";
	import Link from "@tiptap/extension-link";
	import Strike from "@tiptap/extension-strike";
	import Underline from "@tiptap/extension-underline";
	import Highlight from "@tiptap/extension-highlight";
	import Color from "@tiptap/extension-color";
	import FontFamily from "@tiptap/extension-font-family";
	import TextAlign from "@tiptap/extension-text-align";
	import TextStyle from "@tiptap/extension-text-style";
	import type { TextBlock } from "$lib/layout/blocks/textBlock";
	import type { SupabaseClient } from "@supabase/supabase-js";
	import MediaLibraryInput from "../MediaLibraryInput.svelte";
	import { getContext, mount, unmount } from "svelte";
	import { closeTopModal } from "$lib/modalManager.svelte";
	import { onMount, onDestroy } from "svelte";
	import { Editor } from "@tiptap/core";
	import { StarterKit } from "@tiptap/starter-kit";
	import BubbleMenu from "@tiptap/extension-bubble-menu";
	import Page from "../../../routes/(admin)/12midnight/+page.svelte";
	import {
		autoUpdate,
		flip,
		offset,
		useClick,
		useDismiss,
		useFloating,
		useInteractions,
		useRole,
	} from "@skeletonlabs/floating-ui-svelte";
	import TextHeaderPopover from "./TextHeaderPopover.svelte";
	import GenericIdClassSettings from "./GenericIdClassSettings.svelte";
	let { block }: { block: TextBlock } = $props();
	console.log(block);
	let show = $state("content");
	let supabase: SupabaseClient = getContext("supabase");

	let bubbleMenu: HTMLElement | null = $state(null);
	let tiptapEditor: HTMLElement | null = $state(null);
	let editorState: { editor: any } = $state({ editor: null });

	onMount(() => {
		editorState.editor = new Editor({
			element: tiptapEditor!,
			extensions: [
				Blockquote,
				BulletList,
				Document,
				HardBreak,
				Heading,
				ListItem,
				OrderedList,
				Paragraph,
				Text,
				Bold,
				Italic,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						target: null,
					},
				}),
				Strike,
				Typography,
				History,
				Highlight,
				Underline,
				Color,
				FontFamily,
				TextStyle,
				TextAlign.configure({
					types: ["paragraph", "heading"],
				}),
				Placeholder.configure({
					placeholder: "Click to start typing!",
				}),
			],
			onTransaction: ({ editor }) => {
				// Increment the state signal to force a re-render
				editorState = { editor };
				if(editor.isActive("heading")) {
					let level = editor.getAttributes('heading').level;
					headingState = "Heading " + level;
				}else {
					headingState = "Paragraph"
				}
			},
			content: block.content,
			onFocus: () => {
				// this.focus(null, true);
			},
			onBlur: () => {
				// this.tiptapLinkBubbleMenu.classList.add("led-tooltip-hidden");
			},
			// onUpdate: this.tiptapUpdated.bind(this),
			// onSelectionUpdate: this.tiptapSelectionUpdated.bind(this),
		});
	});
	onDestroy(() => {
		editorState.editor?.destroy();
	});

	function saveBlock() {
		block.setData({ content: editorState.editor.getHTML() });
		block.setCSSClasses(blockClasses);
		block.setHtmlId(blockId);
		closeTopModal();
	}

	let textHeadingEl: Element | null = $state(null);
	let textHeadingComponent: any;
    function openTextSettings() {
        if(textHeadingComponent) {
            unmountPopover();
			return;
        }
        textHeadingComponent = mount(TextHeaderPopover,{
            target: document.body,
            props: {
                unmountFn: unmountPopover,
				parentElement: textHeadingEl!,
				headingUpdated
            },
        });
    }
    function unmountPopover() {
        if(textHeadingComponent) {
            unmount(textHeadingComponent);
			textHeadingComponent = null;
        }
    }

	let headingState = $state("Paragraph")

	function headingUpdated(style: number) {
		if(style == 0) {
			editorState.editor.chain().focus().setParagraph().run()

		}else {
			editorState.editor.chain().focus().setHeading({ level: style }).run()
		}
	}

	let blockClasses = $state(block.classes);
	let blockId = $state(block.htmlId);
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
						onclick={() => (show = "content")}>Text Content</button
					><button
						class="admin-editor-tab-button"
						class:active={show == "styles"}
						onclick={() => (show = "styles")}>Styles</button
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
				<div style:display={show == "content" ? "" : "none"}>
				{#if editorState.editor}
					<div class="admin-editor-toolbar">
						<button
							class="admin-editor-toolbar-select"
							bind:this={textHeadingEl}
							onclick={openTextSettings}
						>
							{headingState}
							<i class="ti ti-chevron-down"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().toggleBold().run()}
							class:active={editorState.editor.isActive("bold")}
							aria-label="Bold"
							title="Bold"
						>
							<i class="ti ti-bold"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().toggleItalic().run()}
							class:active={editorState.editor.isActive("italic")}
							aria-label="Italic"
							title="Italic"
						>
							<i class="ti ti-italic"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().toggleUnderline().run()}
							class:active={editorState.editor.isActive("underline")}
							aria-label="Underline"
							title="Underline"
						>
							<i class="ti ti-underline"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().setTextAlign("left").run()}
							class:active={editorState.editor.isActive({ textAlign: "left" })}
							aria-label="Align Left"
							title="Align Left"
						>
							<i class="ti ti-align-left"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().setTextAlign("center").run()}
							class:active={editorState.editor.isActive({
								textAlign: "center",
							})}
							aria-label="Align Center"
							title="Align Center"
						>
							<i class="ti ti-align-center"></i>
						</button>
						<button
							class="admin-editor-toolbar-button"
							onclick={() =>
								editorState.editor.chain().focus().setTextAlign("right").run()}
							class:active={editorState.editor.isActive({ textAlign: "right" })}
							aria-label="Align Right"
							title="Align Right"
						>
							<i class="ti ti-align-right"></i>
						</button>
					</div>
				{/if}

				<div bind:this={tiptapEditor} class="tiptap-editor"></div>
				</div>

				{#if show == "advanced"}
				<div class="admin-editor-column admin-editor-column-fullwidth">
				<GenericIdClassSettings bind:id={blockId} bind:classes={blockClasses}></GenericIdClassSettings>
				</div>
				{/if}
			</div>

			<div class="admin-editor-column">
				<h2>Preview</h2>
				{#if editorState.editor}
				{@html editorState.editor.getHTML()}
				{/if}
			</div>
		</div>

		<div class="admin-page-footer">
			<button class="admin-button" onclick={saveBlock}>Save</button>
		</div>
	</div>
</div>

<style>
	.admin-editor-toolbar {
		width: 100%;
		border-bottom: 1px solid var(--border);
		padding: 6px 16px;
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: start;
		box-sizing: border-box;
		gap: 2px;
	}

	.admin-editor-toolbar-button {
		width: 32px;
		height: 32px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		font-size: 22px;
		background: transparent;
		cursor: pointer;
	}

	.admin-editor-toolbar-button:hover,
	.admin-editor-toolbar-button:focus {
		background: var(--accent-bg);
		color: var(--accent);
	}
	.admin-editor-toolbar-button.active {
		background: var(--accent-bg);

		color: var(--accent);
	}

	.admin-editor-toolbar-select {
		width: 120px;
		height: 32px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0 8px;
		box-sizing: border-box;
		border: 1px solid var(--border);
		

	}

	.admin-editor-toolbar-select:hover,
	.admin-editor-toolbar-select:focus {
		background: var(--accent-bg);
		color: var(--accent);
	}

	.admin-editor-toolbar-select-options {
		position: absolute;
		z-index: 999999999999;
		background: white;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

</style>
