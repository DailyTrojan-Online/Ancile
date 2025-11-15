<script lang="ts">
	import type { TextBlockSaveData } from "$lib/layout/blocks/textBlock";
	import type { BlockSaveData } from "$lib/layout/lithograph";

	let { blockData }: { blockData: BlockSaveData<TextBlockSaveData> } = $props();
</script>

<div class={"ancile-text " + blockData.classes} id={blockData.html_id}>
	{#if blockData}
		{@html blockData.data.content}
	{/if}
</div>
