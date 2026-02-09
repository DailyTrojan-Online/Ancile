<script lang="ts">
	import type { SupabaseClient } from "@supabase/supabase-js";
	import {
		createPopper,
		type Instance,
		type VirtualElement,
	} from "@popperjs/core";
	import { onMount, unmount } from "svelte";

	let {
		parentElement,
		unmountFn,
        headingUpdated,
	}: {
		parentElement: Element;
		unmountFn: () => void;
		headingUpdated: (style: number) => void;
	} = $props();
	let popoverEl: HTMLElement;

	let popper: Instance;
	onMount(() => {
		popper = createPopper(parentElement, popoverEl, {
			placement: "bottom-start",

			modifiers: [
				{
					name: "offset",
					options: {
						offset: [-8, 4],
					},
				},
				{
					name: "preventOverflow",
					options: {
						padding: 8,
					},
				},
			],
		});
	});

	let onclick = (e: MouseEvent) => {
		if (!popoverEl) return;
		if (
			!popoverEl.contains(e.target as Node) &&
			!parentElement.contains(e.target as Node)
		) {
			unmountFn();
		}
	};
    function selectOption(option: number) {
        headingUpdated(option)
        unmountFn();
    }
</script>

<svelte:window {onclick} />

<div
	bind:this={popoverEl}
	class="admin-editor-popover admin-editor-popover-show"
>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(0)}}>Paragraph</button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(1)}}><h1>Heading 1</h1></button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(2)}}><h2>Heading 2</h2></button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(3)}}><h3>Heading 3</h3></button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(4)}}><h4>Heading 4</h4></button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(5)}}><h5>Heading 5</h5></button>
	<button class="admin-editor-toolbar-select-option" onclick={()=>{selectOption(6)}}><h6>Heading 6</h6></button>
</div>

<style>
    .admin-editor-popover {
        z-index: 99999999 !important;
        width: 170px;
        gap: 0;
    }

    .admin-editor-toolbar-select-option * {
        margin: 0 !important;
    }
    .admin-editor-toolbar-select-option {
        height: 40px;
        text-align: left;
        box-sizing: border-box;
        padding: 0 8px;
        cursor: pointer;
        border: none;
        border: 1px solid var(--border);
        border-bottom: none;
        background: transparent;
    }
    .admin-editor-toolbar-select-option:last-child {
        border-bottom: 1px solid var(--border);
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }
    .admin-editor-toolbar-select-option:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }


    .admin-editor-toolbar-select-option:hover {
        background: rgba(0,0,0,.05);
    }
</style>
