<script lang="ts">
	import {
		Block,
		Lithograph,
		type BlockSaveData,
	} from "$lib/layout/lithograph";
	import { onMount } from "svelte";
	import { TextBlock } from "$lib/layout/blocks/textBlock";
	import { DividerBlock } from "$lib/layout/blocks/dividerBlock";
	import {
		ImageBlock,
		type ImageBlockSaveData,
	} from "$lib/layout/blocks/imageBlock";
	import { ContainerBlock } from "$lib/layout/blocks/containerBlock";
	import { PostBlock } from "$lib/layout/blocks/postBlock";
	import MediaLibrary from "./MediaLibrary.svelte";
	import type { SupabaseClient } from "@supabase/supabase-js";
	import { fade } from "svelte/transition";
	import AdminModal from "./AdminModal.svelte";
	import { closeModalById, openModal } from "$lib/modalManager.svelte";

	let {
		lithographData,
		supabase,
		hide,
	}: { lithographData?: any | null; hide?: boolean; supabase: SupabaseClient } =
		$props();

	let holder: HTMLElement;
	let editor: Lithograph;
	onMount(() => {
		editor = new Lithograph({
			data: lithographData,
			container: holder,
			blockTypes: [
				TextBlock,
				DividerBlock,
				ImageBlock,
				ContainerBlock,
				PostBlock,
			],
			enablePreview: false,
		});
		editor.enableFlex();
	});

	export function getJSON() {
		return editor.getJSON();
	}

	let mediaSelectCallback = $state<Function | null>(null);
	let selectedItem: any = $state(null);



</script>

<div class="container" class:lithograph-hidden={hide} bind:this={holder}></div>

