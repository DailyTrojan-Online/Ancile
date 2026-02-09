<script lang="ts">
	import type { ImageBlockSaveData } from "$lib/layout/blocks/imageBlock";
	import type { BlockSaveData } from "$lib/layout/lithograph";

    let {blockData}: {blockData: BlockSaveData<ImageBlockSaveData>} = $props();
</script>
<div class={"ancile-image " + blockData.classes} id={blockData.html_id}>
    <img src={blockData.data.url} alt={blockData.data.alt} />
</div>