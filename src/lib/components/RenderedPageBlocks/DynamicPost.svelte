<script lang="ts">
	import type { PostBlockSaveData } from "$lib/layout/blocks/postBlock";
	import type { BlockSaveData } from "$lib/layout/lithograph";
	import { getPostData } from "$lib/rendererUtil";
	let {
		blockData,
		postBlockData,
		blockId = "",
	}: {
		blockData: BlockSaveData<PostBlockSaveData>;
		postBlockData?: any[];
		blockId: string;
	} = $props();
	let postData = $derived(getPostData(postBlockData!, blockId));
</script>

<div class={"ancile-posts " + blockData.classes} id={blockData.html_id}>
	{#if postData}
		{#each postData as post}
			<a
				class={"ancile-post"}
				href={`/${post.slug}`}
				class:ancile-post-image-left={blockData.data.imagePosition == "left"}
				class:ancile-post-image-bottom={blockData.data.imagePosition ==
					"bottom"}
				class:ancile-post-image-right={blockData.data.imagePosition == "right"}
			>
				{#if blockData.data.imagePosition != "none"}
					<div class="ancile-post-image">
						<img src={post.featured_image} alt="" />
					</div>
				{/if}
				<div class="ancile-post-text">
					{#if blockData.data.showHeadline}
						<h1>{post.title}</h1>
					{/if}
					{#if blockData.data.showSubheadline}
						<p>{post.excerpt}</p>
					{/if}
					{#if blockData.data.showByline}
						<p>Byline</p>
					{/if}
					{#if blockData.data.showPublishDate}
						<p>Publish date</p>
					{/if}
				</div>
			</a>
		{/each}
	{/if}
</div>

<style>
	.ancile-post {
		border: 1px solid red;
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
