<script lang="ts">
	import type { ContainerBlockSaveData } from "$lib/layout/blocks/containerBlock";
	import type { BlockSaveData } from "$lib/layout/lithograph";
	import { componentMap } from "$lib/rendererComponents";
	let {
		blockData,
		postBlockData = [],
		blockId = ""
	}: {
		blockData: BlockSaveData<ContainerBlockSaveData>;
		postBlockData?: any[];
		blockId: string;
	} = $props();
	let children = $derived(blockData.data.children);
</script>

<div
	class={"ancile-container " + blockData.classes}
	id={blockData.html_id}
	style:width={`${(blockData.data.size.numerator / blockData.data.size.denominator) * 100}%`}
>
	{#if blockData}
		{#each children as block}
			{@const Block = componentMap[block.type]}
			<Block blockData={block} {postBlockData} blockId={block.id} />
		{/each}
	{/if}
</div>
